import { and, avg, count, countDistinct, eq, isNotNull, ne } from 'drizzle-orm';
import { db } from '../../db/client';
import { examAttempts } from '../../db/schema/assessment';
import { labSubmissions } from '../../db/schema/labs';
import { enrollments, lessonProgress } from '../../db/schema/progress';

const first = async <T>(query: Promise<T[]>): Promise<T | undefined> => (await query)[0];

/** The headline numbers on a learner's dashboard and profile. */
export async function learnerStats(userId: string) {
  const [enrolled, completed, lessonsRead, exams, labsPassed] = await Promise.all([
    first(db.select({ n: count() }).from(enrollments).where(eq(enrollments.userId, userId))),
    first(db.select({ n: count() }).from(enrollments).where(and(eq(enrollments.userId, userId), isNotNull(enrollments.completedAt)))),
    first(db.select({ n: count() }).from(lessonProgress).where(eq(lessonProgress.userId, userId))),
    first(
      db
        .select({
          taken: count(),
          average: avg(examAttempts.scorePercent),
        })
        .from(examAttempts)
        .where(and(eq(examAttempts.userId, userId), ne(examAttempts.status, 'in_progress'))),
    ),
    first(
      db
        .select({ n: countDistinct(labSubmissions.labId) })
        .from(labSubmissions)
        .where(and(eq(labSubmissions.userId, userId), eq(labSubmissions.kind, 'submit'), eq(labSubmissions.status, 'passed'))),
    ),
  ]);
  const passedExams = await first(
    db
      .select({ n: countDistinct(examAttempts.examId) })
      .from(examAttempts)
      .where(and(eq(examAttempts.userId, userId), eq(examAttempts.passed, true))),
  );
  return {
    coursesEnrolled: Number(enrolled?.n ?? 0),
    coursesCompleted: Number(completed?.n ?? 0),
    lessonsCompleted: Number(lessonsRead?.n ?? 0),
    examsTaken: Number(exams?.taken ?? 0),
    examsPassed: Number(passedExams?.n ?? 0),
    averageScore: exams?.average ? Math.round(Number(exams.average)) : null,
    labsPassed: Number(labsPassed?.n ?? 0),
  };
}
