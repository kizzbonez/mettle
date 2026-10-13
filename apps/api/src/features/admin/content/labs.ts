import { LAB_LANGUAGES } from '@mettle/shared';
import { asc, eq } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db, type Tx } from '../../../db/client';
import { courses, tracks } from '../../../db/schema/catalog';
import { labs, labTestCases } from '../../../db/schema/labs';
import { uniqueOrConflict } from '../../../lib/db-errors';
import { notFound } from '../../../lib/errors';
import { parse, uuidParam } from '../../../lib/validate';
import { audit } from '../../audit/log';
import { runInSandbox } from '../../labs/runner-client';
import { markdownField, slugField, sortOrderField, statusField, titleField } from './fields';
import { labIsSound } from './lab-soundness';

const codeField = z.string().max(100 * 1024);

const labBody = z.object({
  courseId: z.uuid(),
  slug: slugField,
  title: titleField,
  summary: z.string().trim().max(500).default(''),
  scenarioMd: markdownField.default(''),
  instructionsMd: markdownField.default(''),
  language: z.enum(LAB_LANGUAGES),
  starterCode: codeField.default(''),
  solutionCode: codeField.default(''),
  fixtures: z
    .array(z.object({ path: z.string().regex(/^data\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/, 'Fixture paths start with data/.').max(99), content: z.string().max(256 * 1024) }))
    .max(16)
    .default([]),
  timeLimitMs: z.number().int().min(500).max(15_000).default(5000),
  memoryMb: z.number().int().min(32).max(1024).default(256),
  estMinutes: z.number().int().min(1).max(480).default(30),
  status: statusField.default('draft'),
  sortOrder: sortOrderField.default(0),
  tests: z
    .array(z.object({ name: z.string().trim().min(2, 'Name the test.').max(160), code: codeField.min(1, 'A test needs a body.'), hidden: z.boolean() }))
    .min(1, 'Add at least one test case.')
    .max(24),
});

type LabInput = z.infer<typeof labBody>;
const SLUG_TAKEN = 'This course already has a lab with that slug.';

async function replaceTests(labId: string, tests: LabInput['tests'], tx: Tx): Promise<void> {
  await tx.delete(labTestCases).where(eq(labTestCases.labId, labId));
  await tx.insert(labTestCases).values(tests.map((test, sortOrder) => ({ labId, ...test, sortOrder })));
}

async function labWithTests(id: string) {
  const [lab] = await db.select().from(labs).where(eq(labs.id, id)).limit(1);
  if (!lab) throw notFound('Lab');
  const tests = await db.select().from(labTestCases).where(eq(labTestCases.labId, id)).orderBy(asc(labTestCases.sortOrder));
  return { lab, tests };
}

export async function listLabs() {
  const rows = await db
    .select({
      id: labs.id, title: labs.title, slug: labs.slug, language: labs.language, status: labs.status,
      estMinutes: labs.estMinutes, updatedAt: labs.updatedAt, courseTitle: courses.title, level: courses.level, trackTitle: tracks.title,
    })
    .from(labs)
    .innerJoin(courses, eq(courses.id, labs.courseId))
    .innerJoin(tracks, eq(tracks.id, courses.trackId))
    .orderBy(asc(tracks.sortOrder), asc(courses.sortOrder), asc(labs.sortOrder));
  return { labs: rows };
}

export async function getLab(request: FastifyRequest) {
  return labWithTests(parse(uuidParam, request.params).id);
}

export async function createLab(request: FastifyRequest, reply: FastifyReply) {
  const { tests, ...values } = parse(labBody, request.body);
  const id = await uniqueOrConflict(
    () => db.transaction(async (tx) => {
      const [lab] = await tx.insert(labs).values(values).returning({ id: labs.id });
      if (!lab) throw new Error('Could not create the lab');
      await replaceTests(lab.id, tests, tx);
      return lab.id;
    }),
    SLUG_TAKEN,
  );
  await audit(request, { action: 'lab.created', targetType: 'lab', targetId: id });
  return reply.code(201).send({ id });
}

export async function updateLab(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const { tests, ...values } = parse(labBody, request.body);
  await uniqueOrConflict(
    () => db.transaction(async (tx) => {
      const updated = await tx.update(labs).set({ ...values, updatedAt: new Date() }).where(eq(labs.id, id)).returning({ id: labs.id });
      if (updated.length === 0) throw notFound('Lab');
      await replaceTests(id, tests, tx);
    }),
    SLUG_TAKEN,
  );
  return { ok: true };
}

export async function deleteLab(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const removed = await db.delete(labs).where(eq(labs.id, id)).returning({ id: labs.id });
  if (removed.length === 0) throw notFound('Lab');
  await audit(request, { action: 'lab.deleted', targetType: 'lab', targetId: id });
  return { ok: true };
}

/**
 * Runs the reference solution and the starter in the sandbox, and says whether
 * the lab is sound.
 */
export async function verifyLab(request: FastifyRequest) {
  const { lab, tests } = await labWithTests(parse(uuidParam, request.params).id);
  const job = (code: string) =>
    runInSandbox({
      language: lab.language, code, fixtures: lab.fixtures, timeLimitMs: lab.timeLimitMs, memoryMb: lab.memoryMb,
      tests: tests.map((test) => ({ id: test.id, name: test.name, code: test.code })),
    });
  const solution = await job(lab.solutionCode);
  const starter = await job(lab.starterCode);
  const names = new Map(tests.map((test) => [test.id, test.name]));
  const describe = (outcome: typeof solution) => ({
    status: outcome.status,
    durationMs: outcome.durationMs,
    compileOutput: [outcome.compile?.stdout, outcome.compile?.stderr].filter(Boolean).join('\n').trim(),
    error: outcome.error ?? null,
    tests: outcome.tests.map((t) => ({ name: names.get(t.id) ?? t.id, passed: t.passed, durationMs: t.durationMs, stderr: t.stderr, stdout: t.stdout, timedOut: t.timedOut })),
  });
  return {
    sound: labIsSound(solution.status, starter.status),
    solution: describe(solution),
    starter: describe(starter),
  };
}
