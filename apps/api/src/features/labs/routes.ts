import { and, asc, desc, eq, gt, inArray } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/client';
import { courses, tracks } from '../../db/schema/catalog';
import { labDrafts, labs, labSubmissions, labTestCases, submissionResults } from '../../db/schema/labs';
import { conflict, notFound } from '../../lib/errors';
import { parse, uuidParam } from '../../lib/validate';
import { authenticated, me } from '../../plugins/auth';
import { ensureEnrolled } from '../catalog/enrollment';
import { presentCompileOutput } from './compile-output';
import { enqueueSubmission } from './jobs';
import { presentResult } from './mask';

const MAX_CODE_BYTES = 100 * 1024;
const PENDING_WINDOW_MS = 3 * 60_000;
const published = 'published' as const;

const codeField = z.string().max(MAX_CODE_BYTES, 'Your code is too large (100 KB at most).');
const draftBody = z.object({ code: codeField });
const submissionBody = z.object({ code: codeField, kind: z.enum(['run', 'submit']) });

async function publishedLab(labId: string) {
  const [row] = await db
    .select({ lab: labs, course: courses, track: tracks })
    .from(labs)
    .innerJoin(courses, eq(courses.id, labs.courseId))
    .innerJoin(tracks, eq(tracks.id, courses.trackId))
    .where(and(eq(labs.id, labId), eq(labs.status, published), eq(courses.status, published), eq(tracks.status, published)))
    .limit(1);
  if (!row) throw notFound('Lab');
  return row;
}

async function hasPassed(userId: string, labId: string): Promise<boolean> {
  const rows = await db
    .select({ id: labSubmissions.id })
    .from(labSubmissions)
    .where(and(eq(labSubmissions.userId, userId), eq(labSubmissions.labId, labId), eq(labSubmissions.kind, 'submit'), eq(labSubmissions.status, 'passed')))
    .limit(1);
  return rows.length > 0;
}

async function getLab(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const userId = me(request).id;
  const { lab, course, track } = await publishedLab(id);
  await ensureEnrolled(userId, course);
  const [tests, draft, passed] = await Promise.all([
    db.select().from(labTestCases).where(eq(labTestCases.labId, id)).orderBy(asc(labTestCases.sortOrder)),
    db.select().from(labDrafts).where(and(eq(labDrafts.labId, id), eq(labDrafts.userId, userId))).limit(1),
    hasPassed(userId, id),
  ]);
  return {
    lab: {
      id: lab.id, title: lab.title, summary: lab.summary, scenarioMd: lab.scenarioMd, instructionsMd: lab.instructionsMd,
      language: lab.language, starterCode: lab.starterCode, estMinutes: lab.estMinutes, timeLimitMs: lab.timeLimitMs,
      memoryMb: lab.memoryMb, fixtures: lab.fixtures,
      // The reference solution is never part of this payload, and hidden tests are names only.
      tests: tests.map((test) => ({ id: test.id, name: test.name, hidden: test.hidden, code: test.hidden ? null : test.code })),
    },
    course: { id: course.id, title: course.title, level: course.level },
    track: { id: track.id, title: track.title },
    code: draft[0]?.code ?? lab.starterCode,
    passed,
  };
}

async function saveDraft(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const { code } = parse(draftBody, request.body);
  const userId = me(request).id;
  await publishedLab(id);
  await db
    .insert(labDrafts)
    .values({ userId, labId: id, code })
    .onConflictDoUpdate({ target: [labDrafts.userId, labDrafts.labId], set: { code, updatedAt: new Date() } });
  return { ok: true };
}

/** One job per learner at a time: sandboxes are the scarce resource. */
async function assertNoPendingJob(userId: string): Promise<void> {
  const pending = await db
    .select({ id: labSubmissions.id })
    .from(labSubmissions)
    .where(and(eq(labSubmissions.userId, userId), inArray(labSubmissions.status, ['queued', 'running']), gt(labSubmissions.createdAt, new Date(Date.now() - PENDING_WINDOW_MS))))
    .limit(1);
  if (pending.length > 0) throw conflict('Your previous run is still in progress.', 'submission_in_progress');
}

async function createSubmission(request: FastifyRequest, reply: FastifyReply) {
  const { id } = parse(uuidParam, request.params);
  const input = parse(submissionBody, request.body);
  const userId = me(request).id;
  const { course } = await publishedLab(id);
  await ensureEnrolled(userId, course);
  await assertNoPendingJob(userId);
  const [submission] = await db
    .insert(labSubmissions)
    .values({ labId: id, userId, kind: input.kind, code: input.code })
    .returning({ id: labSubmissions.id });
  if (!submission) throw new Error('Could not create the submission');
  enqueueSubmission(submission.id, request.log);
  // 202: accepted, not finished. The page polls GET /submissions/:id.
  return reply.code(202).send({ submissionId: submission.id });
}

async function getSubmission(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const [row] = await db
    .select({ submission: labSubmissions, lab: labs })
    .from(labSubmissions)
    .innerJoin(labs, eq(labs.id, labSubmissions.labId))
    .where(and(eq(labSubmissions.id, id), eq(labSubmissions.userId, me(request).id)))
    .limit(1);
  if (!row) throw notFound('Submission');
  const { submission, lab } = row;
  const results = await db.select().from(submissionResults).where(eq(submissionResults.submissionId, id)).orderBy(asc(submissionResults.sortOrder));
  return {
    id: submission.id, kind: submission.kind, status: submission.status, passedCount: submission.passedCount,
    totalCount: submission.totalCount, durationMs: submission.durationMs, compileOutput: presentCompileOutput(lab.language, submission.compileOutput),
    errorMessage: submission.errorMessage, createdAt: submission.createdAt, finishedAt: submission.finishedAt,
    results: results.map((result) => presentResult(lab.language, result, lab.timeLimitMs)),
  };
}

async function listSubmissions(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const rows = await db
    .select({ id: labSubmissions.id, kind: labSubmissions.kind, status: labSubmissions.status, passedCount: labSubmissions.passedCount, totalCount: labSubmissions.totalCount, durationMs: labSubmissions.durationMs, createdAt: labSubmissions.createdAt })
    .from(labSubmissions)
    .where(and(eq(labSubmissions.labId, id), eq(labSubmissions.userId, me(request).id)))
    .orderBy(desc(labSubmissions.createdAt))
    .limit(20);
  return { submissions: rows };
}

export async function labRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticated);
  // Per-user, not per-IP: a classroom behind one address must not share a budget.
  const perUser = { config: { rateLimit: { max: 15, timeWindow: '1 minute', hook: 'preHandler' as const, keyGenerator: (request: FastifyRequest) => request.currentUser?.id ?? request.ip } } };

  app.get('/labs/:id', getLab);
  app.put('/labs/:id/draft', saveDraft);
  app.get('/labs/:id/submissions', listSubmissions);
  app.post('/labs/:id/submissions', perUser, createSubmission);
  app.get('/submissions/:id', getSubmission);
}
