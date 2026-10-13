import { and, asc, count, eq, ilike, type SQL } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db/client';
import { courses, lessons, tracks } from '../../../db/schema/catalog';
import { uniqueOrConflict } from '../../../lib/db-errors';
import { notFound } from '../../../lib/errors';
import { containsPattern, listQuery, offsetOf, orderOf, toPage } from '../../../lib/listing';
import { parse, parsePatch, uuidParam } from '../../../lib/validate';
import { audit } from '../../audit/log';
import { markdownField, slugField, sortOrderField, statusField, stringList, titleField } from './fields';

const lessonsQuery = listQuery.extend({ courseId: z.uuid().optional(), status: statusField.optional() });

const lessonBody = z.object({
  courseId: z.uuid(),
  slug: slugField,
  title: titleField,
  summary: z.string().trim().max(500).default(''),
  objectives: stringList.default([]),
  bodyMd: markdownField.default(''),
  estMinutes: z.number().int().min(1).max(480).default(15),
  status: statusField.default('draft'),
  sortOrder: sortOrderField.default(0),
});

const sortable = { title: lessons.title, status: lessons.status, sortOrder: lessons.sortOrder, updatedAt: lessons.updatedAt, estMinutes: lessons.estMinutes };
const SLUG_TAKEN = 'This course already has a lesson with that slug.';

export async function listLessons(request: FastifyRequest) {
  const query = parse(lessonsQuery, request.query);
  const filters: SQL[] = [];
  if (query.courseId) filters.push(eq(lessons.courseId, query.courseId));
  if (query.status) filters.push(eq(lessons.status, query.status));
  if (query.q) filters.push(ilike(lessons.title, containsPattern(query.q)));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const [rows, total] = await Promise.all([
    db
      .select({
        id: lessons.id, title: lessons.title, slug: lessons.slug, status: lessons.status, estMinutes: lessons.estMinutes,
        sortOrder: lessons.sortOrder, updatedAt: lessons.updatedAt, courseId: courses.id, courseTitle: courses.title,
        level: courses.level, trackTitle: tracks.title,
      })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .innerJoin(tracks, eq(tracks.id, courses.trackId))
      .where(where)
      .orderBy(orderOf(sortable, query, 'updatedAt'), asc(lessons.sortOrder))
      .limit(query.pageSize)
      .offset(offsetOf(query)),
    db.select({ n: count() }).from(lessons).where(where),
  ]);
  return toPage(rows, Number(total[0]?.n ?? 0), query);
}

export async function getLesson(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!lesson) throw notFound('Lesson');
  return { lesson };
}

export async function createLesson(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(lessonBody, request.body);
  const [lesson] = await uniqueOrConflict(() => db.insert(lessons).values(input).returning(), SLUG_TAKEN);
  await audit(request, { action: 'lesson.created', targetType: 'lesson', targetId: lesson?.id });
  return reply.code(201).send({ lesson });
}

export async function updateLesson(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const input = parsePatch(lessonBody, request.body);
  const [lesson] = await uniqueOrConflict(
    () => db.update(lessons).set({ ...input, updatedAt: new Date() }).where(eq(lessons.id, id)).returning(),
    SLUG_TAKEN,
  );
  if (!lesson) throw notFound('Lesson');
  return { lesson };
}

export async function deleteLesson(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const removed = await db.delete(lessons).where(eq(lessons.id, id)).returning({ id: lessons.id });
  if (removed.length === 0) throw notFound('Lesson');
  await audit(request, { action: 'lesson.deleted', targetType: 'lesson', targetId: id });
  return { ok: true };
}
