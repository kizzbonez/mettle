import { and, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../../db/client';
import { enrollments } from '../../db/schema/progress';
import { parse, uuidParam } from '../../lib/validate';
import { authenticated, me } from '../../plugins/auth';
import { courseProgress } from '../progress/course-progress';
import { getSite, isSetupComplete } from '../settings/site';
import { ensureEnrolled, publishedCourse } from './enrollment';
import { catalogStats, publishedTracks, trackExams } from './queries';
import { courseSyllabus, nextItem } from './syllabus';

const NO_PROGRESS = { total: 0, done: 0, percent: 0 };

async function site() {
  const [settings, setupDone, stats] = await Promise.all([getSite(), isSetupComplete(), catalogStats()]);
  return { name: settings.name, registrationOpen: settings.registrationOpen, setupNeeded: !setupDone, stats };
}

/** Readable without an account: what the landing page shows. */
export async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/site', site);
  app.get('/public/tracks', async () => ({ tracks: await publishedTracks() }));
}

/** The catalog, annotated with this learner's enrollment and progress. */
async function catalog(request: FastifyRequest) {
  const userId = me(request).id;
  const tracks = await publishedTracks();
  const courseIds = tracks.flatMap((track) => track.courses.map((course) => course.id));
  const [progress, enrolled] = await Promise.all([
    courseProgress(userId, courseIds),
    db.select().from(enrollments).where(eq(enrollments.userId, userId)),
  ]);
  const enrollment = new Map(enrolled.map((row) => [row.courseId, row]));
  return {
    tracks: tracks.map((track) => ({
      ...track,
      courses: track.courses.map((course) => ({
        ...course,
        enrolled: enrollment.has(course.id),
        completed: Boolean(enrollment.get(course.id)?.completedAt),
        progress: progress.get(course.id) ?? NO_PROGRESS,
      })),
    })),
  };
}

async function course(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const userId = me(request).id;
  const found = await publishedCourse(id);
  const mine = and(eq(enrollments.courseId, id), eq(enrollments.userId, userId));
  const [syllabus, progress, enrollment, assessments] = await Promise.all([
    courseSyllabus(userId, id),
    courseProgress(userId, [id]),
    db.select().from(enrollments).where(mine).then((rows) => rows[0]),
    trackExams(found.track.id),
  ]);
  return {
    course: { id, level: found.course.level, title: found.course.title, summary: found.course.summary, outcomes: found.course.outcomes },
    track: { id: found.track.id, slug: found.track.slug, title: found.track.title, icon: found.track.icon },
    enrolled: Boolean(enrollment),
    completed: Boolean(enrollment?.completedAt),
    progress: progress.get(id) ?? NO_PROGRESS,
    next: nextItem(syllabus),
    ...syllabus,
    trackExams: assessments,
  };
}

async function enroll(request: FastifyRequest) {
  const { id } = parse(uuidParam, request.params);
  const found = await publishedCourse(id);
  await ensureEnrolled(me(request).id, found.course);
  return { ok: true };
}

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticated);
  app.get('/catalog', catalog);
  app.get('/courses/:id', course);
  app.post('/courses/:id/enroll', enroll);
}
