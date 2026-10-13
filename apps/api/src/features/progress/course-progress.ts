import { and, count, countDistinct, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { examAttempts, exams } from '../../db/schema/assessment';
import { courses, lessons } from '../../db/schema/catalog';
import { labs, labSubmissions } from '../../db/schema/labs';
import { enrollments, lessonProgress } from '../../db/schema/progress';
import { recordActivity } from './activity';

export interface CourseProgress {
  total: number;
  done: number;
  percent: number;
}

type Counts = Map<string, number>;

const toMap = (rows: { courseId: string | null; n: number }[]): Counts =>
  new Map(rows.filter((r) => r.courseId).map((r) => [r.courseId as string, Number(r.n)]));

/** Published lessons, exams and labs per course. */
async function totals(ids: string[]): Promise<Counts[]> {
  const published = 'published' as const;
  return Promise.all([
    db.select({ courseId: lessons.courseId, n: count() }).from(lessons)
      .where(and(inArray(lessons.courseId, ids), eq(lessons.status, published))).groupBy(lessons.courseId).then(toMap),
    db.select({ courseId: exams.courseId, n: count() }).from(exams)
      .where(and(inArray(exams.courseId, ids), eq(exams.status, published))).groupBy(exams.courseId).then(toMap),
    db.select({ courseId: labs.courseId, n: count() }).from(labs)
      .where(and(inArray(labs.courseId, ids), eq(labs.status, published))).groupBy(labs.courseId).then(toMap),
  ]);
}

/** Lessons read, exams passed and labs passed by one user, per course. */
async function achieved(userId: string, ids: string[]): Promise<Counts[]> {
  const published = 'published' as const;
  return Promise.all([
    db.select({ courseId: lessons.courseId, n: count() }).from(lessonProgress)
      .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
      .where(and(eq(lessonProgress.userId, userId), inArray(lessons.courseId, ids), eq(lessons.status, published)))
      .groupBy(lessons.courseId).then(toMap),
    db.select({ courseId: exams.courseId, n: countDistinct(exams.id) }).from(examAttempts)
      .innerJoin(exams, eq(exams.id, examAttempts.examId))
      .where(and(eq(examAttempts.userId, userId), eq(examAttempts.passed, true), inArray(exams.courseId, ids), eq(exams.status, published)))
      .groupBy(exams.courseId).then(toMap),
    db.select({ courseId: labs.courseId, n: countDistinct(labs.id) }).from(labSubmissions)
      .innerJoin(labs, eq(labs.id, labSubmissions.labId))
      .where(and(eq(labSubmissions.userId, userId), eq(labSubmissions.kind, 'submit'), eq(labSubmissions.status, 'passed'), inArray(labs.courseId, ids), eq(labs.status, published)))
      .groupBy(labs.courseId).then(toMap),
  ]);
}

/**
 * Progress through each course: an item counts once the lesson is read, the
 * exam has a passing attempt, or the lab has a passing submission.
 */
export async function courseProgress(userId: string, courseIds: string[]): Promise<Map<string, CourseProgress>> {
  const result = new Map<string, CourseProgress>();
  if (courseIds.length === 0) return result;
  const [all, mine] = await Promise.all([totals(courseIds), achieved(userId, courseIds)]);
  const sum = (maps: Counts[], id: string) => maps.reduce((n, map) => n + (map.get(id) ?? 0), 0);
  for (const id of courseIds) {
    const total = sum(all, id);
    const done = Math.min(total, sum(mine, id));
    result.set(id, { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) });
  }
  return result;
}

/** Marks the enrollment complete the first time every item of the course is done. */
export async function refreshCourseCompletion(userId: string, courseId: string): Promise<void> {
  const progress = (await courseProgress(userId, [courseId])).get(courseId);
  if (!progress || progress.total === 0 || progress.done < progress.total) return;
  const completed = await db
    .update(enrollments)
    .set({ completedAt: new Date() })
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId), isNull(enrollments.completedAt)))
    .returning({ courseId: enrollments.courseId });
  if (completed.length === 0) return;
  const [course] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, courseId)).limit(1);
  await recordActivity({ userId, kind: 'course_completed', title: course?.title ?? 'Course', href: `/courses/${courseId}` });
}
