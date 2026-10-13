import { and, count, desc, eq, ne } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../../db/client';
import { examAttempts, exams } from '../../db/schema/assessment';
import { tracks } from '../../db/schema/catalog';
import { enrollments } from '../../db/schema/progress';
import { listQuery, offsetOf, toPage } from '../../lib/listing';
import { parse } from '../../lib/validate';
import { authenticated, me } from '../../plugins/auth';
import { publishedTracks } from '../catalog/queries';
import { recentActivity } from './activity';
import { courseProgress } from './course-progress';
import { learnerStats } from './learner-stats';
import { myCourses, recommendations } from './my-courses';

async function dashboard(request: FastifyRequest) {
  const userId = me(request).id;
  const [stats, courses, activity] = await Promise.all([learnerStats(userId), myCourses(userId), recentActivity(userId, 8)]);
  return {
    stats,
    inProgress: courses.filter((course) => !course.completed).slice(0, 4),
    recommended: await recommendations(userId, courses),
    activity,
  };
}

async function listMyCourses(request: FastifyRequest) {
  return { courses: await myCourses(me(request).id) };
}

/** Levels of every track with this learner's state on each, for the skill tree. */
async function skillTree(request: FastifyRequest) {
  const userId = me(request).id;
  const catalog = await publishedTracks();
  const ids = catalog.flatMap((track) => track.courses.map((course) => course.id));
  const [progress, joined] = await Promise.all([
    courseProgress(userId, ids),
    db.select().from(enrollments).where(eq(enrollments.userId, userId)),
  ]);
  const enrollment = new Map(joined.map((row) => [row.courseId, row]));
  return {
    tracks: catalog.map((track) => {
      let earlierDone = true;
      const levels = track.courses.map((course) => {
        const completed = Boolean(enrollment.get(course.id)?.completedAt);
        const percent = progress.get(course.id)?.percent ?? 0;
        // "ahead" is advice, not a lock: every level can be opened at any time.
        const state = completed ? 'completed' : enrollment.has(course.id) ? 'in_progress' : earlierDone ? 'ready' : 'ahead';
        earlierDone = earlierDone && completed;
        return { courseId: course.id, level: course.level, title: course.title, percent, state };
      });
      return { id: track.id, slug: track.slug, title: track.title, icon: track.icon, levels };
    }),
  };
}

async function examHistory(request: FastifyRequest) {
  const query = parse(listQuery, request.query);
  const mine = and(eq(examAttempts.userId, me(request).id), ne(examAttempts.status, 'in_progress'));
  const [rows, total] = await Promise.all([
    db
      .select({
        id: examAttempts.id,
        examId: exams.id,
        examTitle: exams.title,
        trackTitle: tracks.title,
        status: examAttempts.status,
        startedAt: examAttempts.startedAt,
        submittedAt: examAttempts.submittedAt,
        scorePercent: examAttempts.scorePercent,
        correctCount: examAttempts.correctCount,
        totalCount: examAttempts.totalCount,
        passed: examAttempts.passed,
      })
      .from(examAttempts)
      .innerJoin(exams, eq(exams.id, examAttempts.examId))
      .innerJoin(tracks, eq(tracks.id, exams.trackId))
      .where(mine)
      .orderBy(desc(examAttempts.startedAt))
      .limit(query.pageSize)
      .offset(offsetOf(query)),
    db.select({ n: count() }).from(examAttempts).where(mine),
  ]);
  return toPage(rows, Number(total[0]?.n ?? 0), query);
}

export async function progressRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticated);
  app.get('/me/dashboard', dashboard);
  app.get('/me/courses', listMyCourses);
  app.get('/me/skill-tree', skillTree);
  app.get('/me/exam-history', examHistory);
  app.get('/me/stats', async (request) => ({ stats: await learnerStats(me(request).id) }));
}
