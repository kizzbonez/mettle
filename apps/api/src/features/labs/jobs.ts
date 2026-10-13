import type { RunnerResponse } from '@mettle/shared';
import { asc, eq, inArray } from 'drizzle-orm';
import type { FastifyBaseLogger } from 'fastify';
import { db } from '../../db/client';
import { labs, labSubmissions, labTestCases, submissionResults } from '../../db/schema/labs';
import { recordActivity } from '../progress/activity';
import { refreshCourseCompletion } from '../progress/course-progress';
import { runInSandbox } from './runner-client';

type TestRow = typeof labTestCases.$inferSelect;
type LabRow = typeof labs.$inferSelect;

/** Run executes the visible sample tests; Submit executes all of them. */
function testsFor(kind: 'run' | 'submit', all: TestRow[]): TestRow[] {
  const visible = all.filter((test) => !test.hidden);
  return kind === 'run' && visible.length > 0 ? visible : all;
}

async function storeOutcome(submissionId: string, tests: TestRow[], outcome: RunnerResponse): Promise<void> {
  const byId = new Map(outcome.tests.map((result) => [result.id, result]));
  await db.transaction(async (tx) => {
    const rows = tests.flatMap((test, index) => {
      const result = byId.get(test.id);
      if (!result) return [];
      return [{
        submissionId,
        testCaseId: test.id,
        name: test.name,
        hidden: test.hidden,
        passed: result.passed,
        timedOut: result.timedOut,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        stdout: result.stdout,
        stderr: result.stderr,
        sortOrder: index,
      }];
    });
    if (rows.length > 0) await tx.insert(submissionResults).values(rows);
    await tx
      .update(labSubmissions)
      .set({
        status: outcome.status,
        passedCount: outcome.tests.filter((t) => t.passed).length,
        totalCount: tests.length,
        durationMs: outcome.durationMs,
        compileOutput: [outcome.compile?.stdout, outcome.compile?.stderr].filter(Boolean).join('\n').trim(),
        errorMessage: outcome.error ?? null,
        finishedAt: new Date(),
      })
      .where(eq(labSubmissions.id, submissionId));
  });
}

async function celebrate(userId: string, lab: LabRow): Promise<void> {
  await recordActivity({ userId, kind: 'lab_passed', title: lab.title, href: `/labs/${lab.id}` });
  await refreshCourseCompletion(userId, lab.courseId);
}

async function processSubmission(submissionId: string): Promise<void> {
  const [row] = await db
    .select({ submission: labSubmissions, lab: labs })
    .from(labSubmissions)
    .innerJoin(labs, eq(labs.id, labSubmissions.labId))
    .where(eq(labSubmissions.id, submissionId))
    .limit(1);
  if (!row) return;
  const { submission, lab } = row;
  const all = await db.select().from(labTestCases).where(eq(labTestCases.labId, lab.id)).orderBy(asc(labTestCases.sortOrder));
  const tests = testsFor(submission.kind, all);

  await db.update(labSubmissions).set({ status: 'running' }).where(eq(labSubmissions.id, submissionId));
  const outcome = await runInSandbox({
    language: lab.language,
    code: submission.code,
    fixtures: lab.fixtures,
    tests: tests.map((test) => ({ id: test.id, name: test.name, code: test.code })),
    timeLimitMs: lab.timeLimitMs,
    memoryMb: lab.memoryMb,
  });
  await storeOutcome(submissionId, tests, outcome);
  if (submission.kind === 'submit' && outcome.status === 'passed') await celebrate(submission.userId, lab);
}

/**
 * Starts a job without waiting for it. The request that created the submission
 * has already answered 202; the page polls for the outcome.
 */
export function enqueueSubmission(submissionId: string, log: FastifyBaseLogger): void {
  processSubmission(submissionId).catch(async (error) => {
    log.error(error, 'lab submission failed');
    await db
      .update(labSubmissions)
      .set({ status: 'error', errorMessage: 'The submission could not be processed.', finishedAt: new Date() })
      .where(eq(labSubmissions.id, submissionId));
  });
}

/** Jobs live in this process. Anything still pending at start-up was lost with the last one. */
export async function failInterruptedSubmissions(): Promise<number> {
  const interrupted = await db
    .update(labSubmissions)
    .set({ status: 'error', errorMessage: 'The server restarted while this was running. Submit again.', finishedAt: new Date() })
    .where(inArray(labSubmissions.status, ['queued', 'running']))
    .returning({ id: labSubmissions.id });
  return interrupted.length;
}
