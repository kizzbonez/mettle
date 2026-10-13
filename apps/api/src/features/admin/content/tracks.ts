import { asc, count, eq } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db/client';
import { courses, tracks } from '../../../db/schema/catalog';
import { uniqueOrConflict } from '../../../lib/db-errors';
import { notFound } from '../../../lib/errors';
import { parse, parsePatch, uuidParam } from '../../../lib/validate';
import { audit } from '../../audit/log';
import { difficultyField, slugField, sortOrderField, statusField, stringList, titleField } from './fields';

const trackBody = z.object({
  slug: slugField,
  title: titleField,
  tagline: z.string().trim().max(200).default(''),
  description: z.string().trim().max(2000).default(''),
  icon: z.string().trim().regex(/^[A-Za-z0-9]+$/, 'Use a Lucide icon name, such as ShieldCheck.').max(40).default('Boxes'),
  status: statusField.default('draft'),
  sortOrder: sortOrderField.default(0),
});

const courseBody = z.object({
  trackId: z.uuid(),
  slug: slugField,
  level: difficultyField,
  title: titleField,
  summary: z.string().trim().max(1000).default(''),
  outcomes: stringList.default([]),
  status: statusField.default('draft'),
  sortOrder: sortOrderField.default(0),
});

const SLUG_TAKEN = 'That slug is already in use here.';

export async function listTracks() {
  const [rows, counts] = await Promise.all([
    db.select().from(tracks).orderBy(asc(tracks.sortOrder), asc(tracks.title)),
    db.select({ trackId: courses.trackId, n: count() }).from(courses).groupBy(courses.trackId),
  ]);
  const courseCount = new Map(counts.map((row) => [row.trackId, Number(row.n)]));
  return { tracks: rows.map((track) => ({ ...track, courseCount: courseCount.get(track.id) ?? 0 })) };
}

export async function createTrack(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(trackBody, request.body);
  const [track] = await uniqueOrConflict(() => db.insert(tracks).values(input).returning(), SLUG_TAKEN);
  await audit(request, { action: 'track.created', targetType: 'track', targetId: track?.id });
  return reply.code(201).send({ track });
}

export async function updateTrack(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const input = parsePatch(trackBody, request.body);
  const [track] = await uniqueOrConflict(
    () => db.update(tracks).set({ ...input, updatedAt: new Date() }).where(eq(tracks.id, id)).returning(),
    SLUG_TAKEN,
  );
  if (!track) throw notFound('Track');
  return { track };
}

export async function deleteTrack(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const removed = await db.delete(tracks).where(eq(tracks.id, id)).returning({ id: tracks.id });
  if (removed.length === 0) throw notFound('Track');
  await audit(request, { action: 'track.deleted', targetType: 'track', targetId: id });
  return { ok: true };
}

export async function listCourses() {
  const rows = await db
    .select({ course: courses, trackTitle: tracks.title })
    .from(courses)
    .innerJoin(tracks, eq(tracks.id, courses.trackId))
    .orderBy(asc(tracks.sortOrder), asc(courses.sortOrder));
  return { courses: rows.map((row) => ({ ...row.course, trackTitle: row.trackTitle })) };
}

export async function createCourse(request: FastifyRequest, reply: FastifyReply) {
  const input = parse(courseBody, request.body);
  const [course] = await uniqueOrConflict(() => db.insert(courses).values(input).returning(), SLUG_TAKEN);
  await audit(request, { action: 'course.created', targetType: 'course', targetId: course?.id });
  return reply.code(201).send({ course });
}

export async function updateCourse(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const input = parsePatch(courseBody, request.body);
  const [course] = await uniqueOrConflict(
    () => db.update(courses).set({ ...input, updatedAt: new Date() }).where(eq(courses.id, id)).returning(),
    SLUG_TAKEN,
  );
  if (!course) throw notFound('Course');
  return { course };
}

export async function deleteCourse(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const removed = await db.delete(courses).where(eq(courses.id, id)).returning({ id: courses.id });
  if (removed.length === 0) throw notFound('Course');
  await audit(request, { action: 'course.deleted', targetType: 'course', targetId: id });
  return { ok: true };
}
