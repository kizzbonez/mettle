import { and, asc, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../../db/client';
import { courses, lessons, tracks } from '../../db/schema/catalog';
import { lessonProgress } from '../../db/schema/progress';
import { notFound } from '../../lib/errors';
import { parse, uuidParam } from '../../lib/validate';
import { authenticated, me } from '../../plugins/auth';
import { ensureEnrolled } from '../catalog/enrollment';
import { recordActivity } from '../progress/activity';
import { refreshCourseCompletion } from '../progress/course-progress';

const published = 'published' as const;

async function publishedLesson(lessonId: string) {
  const [row] = await db
    .select({ lesson: lessons, course: courses, track: tracks })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .innerJoin(tracks, eq(tracks.id, courses.trackId))
    .where(and(eq(lessons.id, lessonId), eq(lessons.status, published), eq(courses.status, published), eq(tracks.status, published)))
    .limit(1);
  if (!row) throw notFound('Lesson');
  return row;
}

/** The lessons either side of this one, for previous/next links. */
async function neighbors(courseId: string, lessonId: string) {
  const siblings = await db
    .select({ id: lessons.id, title: lessons.title })
    .from(lessons)
    .where(and(eq(lessons.courseId, courseId), eq(lessons.status, published)))
    .orderBy(asc(lessons.sortOrder));
  const index = siblings.findIndex((item) => item.id === lessonId);
  return {
    position: index + 1,
    count: siblings.length,
    previous: siblings[index - 1] ?? null,
    next: siblings[index + 1] ?? null,
  };
}

async function readLesson(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const userId = me(request).id;
  const { lesson, course, track } = await publishedLesson(id);
  await ensureEnrolled(userId, course);
  const mine = and(eq(lessonProgress.lessonId, id), eq(lessonProgress.userId, userId));
  const [nav, done] = await Promise.all([neighbors(course.id, id), db.select().from(lessonProgress).where(mine).limit(1)]);
  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      objectives: lesson.objectives,
      bodyMd: lesson.bodyMd,
      estMinutes: lesson.estMinutes,
    },
    course: { id: course.id, title: course.title, level: course.level },
    track: { id: track.id, title: track.title, slug: track.slug },
    done: done.length > 0,
    ...nav,
  };
}

async function completeLesson(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const userId = me(request).id;
  const { lesson, course } = await publishedLesson(id);
  await ensureEnrolled(userId, course);
  const created = await db
    .insert(lessonProgress)
    .values({ userId, lessonId: id })
    .onConflictDoNothing()
    .returning({ lessonId: lessonProgress.lessonId });
  if (created.length > 0) {
    await recordActivity({ userId, kind: 'lesson_completed', title: lesson.title, href: `/lessons/${id}` });
    await refreshCourseCompletion(userId, course.id);
  }
  return { ok: true };
}

export async function lessonRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticated);
  app.get('/lessons/:id', readLesson);
  app.post('/lessons/:id/complete', completeLesson);
}
