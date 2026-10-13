import { QUESTION_TYPES } from '@mettle/shared';
import { and, asc, count, eq, ilike, sql, type SQL } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db/client';
import { categories, questionOptions, questions } from '../../../db/schema/assessment';
import { tracks } from '../../../db/schema/catalog';
import { uniqueOrConflict } from '../../../lib/db-errors';
import { notFound } from '../../../lib/errors';
import { containsPattern, listQuery, offsetOf, orderOf, toPage } from '../../../lib/listing';
import { parse, uuidParam } from '../../../lib/validate';
import { me } from '../../../plugins/auth';
import { audit } from '../../audit/log';
import { difficultyField, slugField, statusField } from './fields';
import { insertQuestion, questionBody, saveOptions } from './question-write';

const questionsQuery = listQuery.extend({
  trackId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  difficulty: difficultyField.optional(),
  status: statusField.optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  tag: z.string().trim().max(40).optional(),
});

const importBody = z.object({ questions: z.array(questionBody).min(1).max(500) });
const categoryBody = z.object({ slug: slugField, name: z.string().trim().min(2).max(60) });

const sortable = { updatedAt: questions.updatedAt, createdAt: questions.createdAt, difficulty: questions.difficulty, status: questions.status, type: questions.type };

function filtersOf(query: z.infer<typeof questionsQuery>): SQL | undefined {
  const filters: SQL[] = [];
  if (query.trackId) filters.push(eq(questions.trackId, query.trackId));
  if (query.categoryId) filters.push(eq(questions.categoryId, query.categoryId));
  if (query.difficulty) filters.push(eq(questions.difficulty, query.difficulty));
  if (query.status) filters.push(eq(questions.status, query.status));
  if (query.type) filters.push(eq(questions.type, query.type));
  if (query.tag) filters.push(sql`${questions.tags} @> ARRAY[${query.tag}]::text[]`);
  if (query.q) filters.push(ilike(questions.promptMd, containsPattern(query.q)));
  return filters.length > 0 ? and(...filters) : undefined;
}

/** The bank, paginated on the server: it is built to hold thousands of questions. */
export async function listQuestions(request: FastifyRequest) {
  const query = parse(questionsQuery, request.query);
  const where = filtersOf(query);
  const [rows, total] = await Promise.all([
    db
      .select({
        id: questions.id, promptMd: questions.promptMd, type: questions.type, difficulty: questions.difficulty,
        status: questions.status, tags: questions.tags, updatedAt: questions.updatedAt,
        trackTitle: tracks.title, categoryName: categories.name,
      })
      .from(questions)
      .leftJoin(tracks, eq(tracks.id, questions.trackId))
      .leftJoin(categories, eq(categories.id, questions.categoryId))
      .where(where)
      .orderBy(orderOf(sortable, query, 'updatedAt'), asc(questions.id))
      .limit(query.pageSize)
      .offset(offsetOf(query)),
    db.select({ n: count() }).from(questions).where(where),
  ]);
  return toPage(rows, Number(total[0]?.n ?? 0), query);
}

export async function getQuestion(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const [question] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!question) throw notFound('Question');
  const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, id)).orderBy(asc(questionOptions.sortOrder));
  return { question: { ...question, options } };
}

export async function createQuestion(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(questionBody, request.body);
  const id = await uniqueOrConflict(() => db.transaction((tx) => insertQuestion(input, me(request).id, tx)), 'That question already exists.');
  await audit(request, { action: 'question.created', targetType: 'question', targetId: id });
  return reply.code(201).send({ id });
}

export async function updateQuestion(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const { options, ...values } = parse(questionBody, request.body);
  await uniqueOrConflict(
    () =>
      db.transaction(async (tx) => {
        const updated = await tx.update(questions).set({ ...values, updatedAt: new Date() }).where(eq(questions.id, id)).returning({ id: questions.id });
        if (updated.length === 0) throw notFound('Question');
        await saveOptions(id, options, tx);
      }),
    'That question already exists.',
  );
  return { ok: true };
}

export async function deleteQuestion(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const removed = await db.delete(questions).where(eq(questions.id, id)).returning({ id: questions.id });
  if (removed.length === 0) throw notFound('Question');
  await audit(request, { action: 'question.deleted', targetType: 'question', targetId: id });
  return { ok: true };
}

/** Adds up to 500 questions in one transaction: all of them, or none. */
export async function importQuestions(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(importBody, request.body);
  const author = me(request).id;
  const created = await uniqueOrConflict(
    () => db.transaction(async (tx) => {
      for (const question of input.questions) await insertQuestion(question, author, tx);
      return input.questions.length;
    }),
    'One of the questions refers to a track or category that does not exist.',
  );
  await audit(request, { action: 'question.imported', meta: { count: created } });
  return reply.code(201).send({ created });
}

export async function listCategories() {
  return { categories: await db.select().from(categories).orderBy(asc(categories.name)) };
}

export async function createCategory(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(categoryBody, request.body);
  const [category] = await uniqueOrConflict(() => db.insert(categories).values(input).returning(), 'That category already exists.');
  return reply.code(201).send({ category });
}
