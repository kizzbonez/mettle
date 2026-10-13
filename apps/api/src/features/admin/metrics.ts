import { and, count, desc, eq, gte, ne, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { examAttempts, questions } from '../../db/schema/assessment';
import { courses, lessons, tracks } from '../../db/schema/catalog';
import { users } from '../../db/schema/identity';
import { labs, labSubmissions } from '../../db/schema/labs';
import { enrollments } from '../../db/schema/progress';
import { runnerHealth } from '../labs/runner-client';

const DAY_MS = 24 * 60 * 60_000;
const one = async (query: Promise<{ n: number }[]>) => Number((await query)[0]?.n ?? 0);
const rate = (part: number, whole: number) => (whole === 0 ? null : Math.round((part / whole) * 1000) / 10);

async function userNumbers() {
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const monthAgo = new Date(Date.now() - 30 * DAY_MS);
  const [total, active, recent, banned] = await Promise.all([
    one(db.select({ n: count() }).from(users)),
    one(db.select({ n: count() }).from(users).where(gte(users.lastSeenAt, weekAgo))),
    one(db.select({ n: count() }).from(users).where(gte(users.createdAt, monthAgo))),
    one(db.select({ n: count() }).from(users).where(eq(users.status, 'banned'))),
  ]);
  return { total, activeLast7Days: active, newLast30Days: recent, banned };
}

async function submissionNumbers() {
  const closed = ne(examAttempts.status, 'in_progress');
  const graded = and(eq(labSubmissions.kind, 'submit'), ne(labSubmissions.status, 'queued'), ne(labSubmissions.status, 'running'));
  const [examTotal, examPassed, labTotal, labPassed, runs] = await Promise.all([
    one(db.select({ n: count() }).from(examAttempts).where(closed)),
    one(db.select({ n: count() }).from(examAttempts).where(and(closed, eq(examAttempts.passed, true)))),
    one(db.select({ n: count() }).from(labSubmissions).where(graded)),
    one(db.select({ n: count() }).from(labSubmissions).where(and(graded, eq(labSubmissions.status, 'passed')))),
    one(db.select({ n: count() }).from(labSubmissions).where(eq(labSubmissions.kind, 'run'))),
  ]);
  return {
    total: examTotal + labTotal,
    exams: { total: examTotal, passed: examPassed, passRate: rate(examPassed, examTotal) },
    labs: { total: labTotal, passed: labPassed, passRate: rate(labPassed, labTotal), runs },
  };
}

async function contentNumbers() {
  const [trackCount, courseCount, lessonCount, questionCount, labCount] = await Promise.all([
    one(db.select({ n: count() }).from(tracks)),
    one(db.select({ n: count() }).from(courses)),
    one(db.select({ n: count() }).from(lessons)),
    one(db.select({ n: count() }).from(questions)),
    one(db.select({ n: count() }).from(labs)),
  ]);
  return { tracks: trackCount, courses: courseCount, lessons: lessonCount, questions: questionCount, labs: labCount };
}

interface DayRow extends Record<string, unknown> {
  day: string;
  signups: string;
  exams: string;
  labs: string;
}

/** One row per day for the last 30 days (UTC), zero-filled, oldest first. */
async function dailySeries() {
  const result = await db.execute<DayRow>(sql`
    select to_char(d, 'YYYY-MM-DD') as day,
      (select count(*) from users u where u.created_at >= d and u.created_at < d + interval '1 day') as signups,
      (select count(*) from exam_attempts a where a.submitted_at >= d and a.submitted_at < d + interval '1 day') as exams,
      (select count(*) from lab_submissions s where s.kind = 'submit' and s.created_at >= d and s.created_at < d + interval '1 day') as labs
    from generate_series(date_trunc('day', now() at time zone 'utc') - interval '29 days', date_trunc('day', now() at time zone 'utc'), interval '1 day') as d
    order by d`);
  return result.rows.map((row) => ({ day: row.day, signups: Number(row.signups), exams: Number(row.exams), labs: Number(row.labs) }));
}

async function topCourses() {
  return db
    .select({ id: courses.id, title: courses.title, level: courses.level, track: tracks.title, learners: count() })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(tracks, eq(tracks.id, courses.trackId))
    .groupBy(courses.id, tracks.title)
    .orderBy(desc(count()))
    .limit(5);
}

async function recentSignups() {
  return db
    .select({ id: users.id, displayName: users.displayName, email: users.email, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(6);
}

export async function adminMetrics() {
  const [userStats, submissions, content, series, courseRanking, signups, sandbox] = await Promise.all([
    userNumbers(), submissionNumbers(), contentNumbers(), dailySeries(), topCourses(), recentSignups(), runnerHealth(),
  ]);
  return { users: userStats, submissions, content, series, topCourses: courseRanking, recentSignups: signups, sandbox };
}
