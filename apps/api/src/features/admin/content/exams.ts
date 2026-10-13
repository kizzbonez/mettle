import { and, asc, count, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db, type Tx } from '../../../db/client';
import { examQuestions, examRules, exams, questions } from '../../../db/schema/assessment';
import { courses, tracks } from '../../../db/schema/catalog';
import { uniqueOrConflict } from '../../../lib/db-errors';
import { notFound } from '../../../lib/errors';
import { parse, uuidParam } from '../../../lib/validate';
import { audit } from '../../audit/log';
import { difficultyField, slugField, sortOrderField, statusField, titleField } from './fields';

const ruleBody = z.object({
  trackId: z.uuid().nullable().default(null),
  categoryId: z.uuid().nullable().default(null),
  difficulty: difficultyField.nullable().default(null),
  tag: z.string().trim().max(40).nullable().default(null),
  count: z.number().int().min(1).max(200),
});

const examBody = z.object({
  trackId: z.uuid(),
  courseId: z.uuid().nullable().default(null),
  slug: slugField,
  title: titleField,
  description: z.string().trim().max(1000).default(''),
  mode: z.enum(['fixed', 'dynamic']),
  timeLimitMinutes: z.number().int().min(1).max(480),
  passPercent: z.number().int().min(1).max(100),
  shuffleOptions: z.boolean().default(true),
  maxAttempts: z.number().int().min(1).max(100).nullable().default(null),
  status: statusField.default('draft'),
  sortOrder: sortOrderField.default(0),
  /** Used when mode is dynamic. */
  rules: z.array(ruleBody).max(20).default([]),
  /** Used when mode is fixed. */
  questionIds: z.array(z.uuid()).max(300).default([]),
});

type ExamInput = z.infer<typeof examBody>;
type RuleInput = z.infer<typeof ruleBody>;
const SLUG_TAKEN = 'This track already has an exam with that slug.';

async function replaceBlueprint(examId: string, input: ExamInput, tx: Tx): Promise<void> {
  await tx.delete(examRules).where(eq(examRules.examId, examId));
  await tx.delete(examQuestions).where(eq(examQuestions.examId, examId));
  if (input.rules.length > 0) {
    await tx.insert(examRules).values(input.rules.map((rule, sortOrder) => ({ examId, ...rule, sortOrder })));
  }
  if (input.questionIds.length > 0) {
    await tx.insert(examQuestions).values(input.questionIds.map((questionId, sortOrder) => ({ examId, questionId, sortOrder })));
  }
}

/** Published questions a rule could draw from; tells the author if a blueprint can be met. */
async function poolSize(rule: RuleInput): Promise<number> {
  const filters: SQL[] = [eq(questions.status, 'published')];
  if (rule.trackId) filters.push(eq(questions.trackId, rule.trackId));
  if (rule.categoryId) filters.push(eq(questions.categoryId, rule.categoryId));
  if (rule.difficulty) filters.push(eq(questions.difficulty, rule.difficulty));
  if (rule.tag) filters.push(sql`${questions.tags} @> ARRAY[${rule.tag}]::text[]`);
  const [row] = await db.select({ n: count() }).from(questions).where(and(...filters));
  return Number(row?.n ?? 0);
}

export async function listExams() {
  const rows = await db
    .select({ exam: exams, trackTitle: tracks.title, courseTitle: courses.title })
    .from(exams)
    .innerJoin(tracks, eq(tracks.id, exams.trackId))
    .leftJoin(courses, eq(courses.id, exams.courseId))
    .orderBy(asc(tracks.sortOrder), asc(exams.sortOrder), asc(exams.title));
  return { exams: rows.map((row) => ({ ...row.exam, trackTitle: row.trackTitle, courseTitle: row.courseTitle })) };
}

export async function getExam(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const [exam] = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
  if (!exam) throw notFound('Exam');
  const [rules, pinned] = await Promise.all([
    db.select().from(examRules).where(eq(examRules.examId, id)).orderBy(asc(examRules.sortOrder)),
    db.select({ questionId: examQuestions.questionId }).from(examQuestions).where(eq(examQuestions.examId, id)).orderBy(asc(examQuestions.sortOrder)),
  ]);
  const ids = pinned.map((row) => row.questionId);
  const prompts = ids.length > 0
    ? await db.select({ id: questions.id, promptMd: questions.promptMd, status: questions.status }).from(questions).where(inArray(questions.id, ids))
    : [];
  const byId = new Map(prompts.map((row) => [row.id, row]));
  return {
    exam,
    rules: await Promise.all(rules.map(async (rule) => ({ ...rule, available: await poolSize(rule) }))),
    questions: ids.map((questionId) => byId.get(questionId)).filter(Boolean),
  };
}

export async function createExam(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(examBody, request.body);
  const { rules: _rules, questionIds: _ids, ...values } = input;
  const id = await uniqueOrConflict(
    () => db.transaction(async (tx) => {
      const [exam] = await tx.insert(exams).values(values).returning({ id: exams.id });
      if (!exam) throw new Error('Could not create the exam');
      await replaceBlueprint(exam.id, input, tx);
      return exam.id;
    }),
    SLUG_TAKEN,
  );
  await audit(request, { action: 'exam.created', targetType: 'exam', targetId: id });
  return reply.code(201).send({ id });
}

export async function updateExam(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const input = parse(examBody, request.body);
  const { rules: _rules, questionIds: _ids, ...values } = input;
  await uniqueOrConflict(
    () => db.transaction(async (tx) => {
      const updated = await tx.update(exams).set({ ...values, updatedAt: new Date() }).where(eq(exams.id, id)).returning({ id: exams.id });
      if (updated.length === 0) throw notFound('Exam');
      await replaceBlueprint(id, input, tx);
    }),
    SLUG_TAKEN,
  );
  return { ok: true };
}

export async function deleteExam(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const removed = await db.delete(exams).where(eq(exams.id, id)).returning({ id: exams.id });
  if (removed.length === 0) throw notFound('Exam');
  await audit(request, { action: 'exam.deleted', targetType: 'exam', targetId: id });
  return { ok: true };
}
