import { and, eq, inArray, lt } from 'drizzle-orm';
import { db } from '../../db/client';
import { attemptQuestions, examAttempts, exams, questionOptions } from '../../db/schema/assessment';
import { recordActivity } from '../progress/activity';
import { refreshCourseCompletion } from '../progress/course-progress';
import { isAnswerCorrect, scoreAttempt, type Score } from './grade';

/** Answers that arrive this long after the deadline are still accepted (network delay). */
export const DEADLINE_GRACE_MS = 5000;

type AttemptRow = typeof examAttempts.$inferSelect;
type ExamRow = typeof exams.$inferSelect;
interface Graded {
  id: string;
  isCorrect: boolean;
}

async function correctOptionsByQuestion(questionIds: string[]): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ id: questionOptions.id, questionId: questionOptions.questionId })
    .from(questionOptions)
    .where(and(inArray(questionOptions.questionId, questionIds), eq(questionOptions.isCorrect, true)));
  const map = new Map<string, string[]>();
  for (const row of rows) map.set(row.questionId, [...(map.get(row.questionId) ?? []), row.id]);
  return map;
}

async function gradeAnswers(attemptId: string): Promise<Graded[]> {
  const dealt = await db.select().from(attemptQuestions).where(eq(attemptQuestions.attemptId, attemptId));
  const correct = await correctOptionsByQuestion(dealt.map((item) => item.questionId));
  return dealt.map((item) => ({
    id: item.id,
    isCorrect: isAnswerCorrect(correct.get(item.questionId) ?? [], item.selectedOptionIds),
  }));
}

/**
 * Writes the result. The UPDATE only matches while the attempt is still in
 * progress, so a submit racing the deadline sweep stores exactly one result.
 */
async function closeAttempt(attempt: AttemptRow, graded: Graded[], score: Score): Promise<boolean> {
  const late = Date.now() > attempt.expiresAt.getTime() + DEADLINE_GRACE_MS;
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(examAttempts)
      .set({
        status: late ? 'expired' : 'submitted',
        submittedAt: late ? attempt.expiresAt : new Date(),
        correctCount: score.correct,
        scorePercent: score.percent,
        passed: score.passed,
      })
      .where(and(eq(examAttempts.id, attempt.id), eq(examAttempts.status, 'in_progress')))
      .returning({ id: examAttempts.id });
    if (updated.length === 0) return false;
    for (const item of graded) {
      await tx.update(attemptQuestions).set({ isCorrect: item.isCorrect }).where(eq(attemptQuestions.id, item.id));
    }
    return true;
  });
}

async function announce(attempt: AttemptRow, exam: ExamRow, score: Score): Promise<void> {
  await recordActivity({
    userId: attempt.userId,
    kind: score.passed ? 'exam_passed' : 'exam_failed',
    title: exam.title,
    href: `/attempts/${attempt.id}`,
    meta: { score: score.percent },
  });
  if (score.passed && exam.courseId) await refreshCourseCompletion(attempt.userId, exam.courseId);
}

/** Grades an attempt and closes it. Safe to call twice; the second call does nothing. */
export async function finalizeAttempt(attemptId: string): Promise<Score | null> {
  const [row] = await db
    .select({ attempt: examAttempts, exam: exams })
    .from(examAttempts)
    .innerJoin(exams, eq(exams.id, examAttempts.examId))
    .where(eq(examAttempts.id, attemptId))
    .limit(1);
  if (!row || row.attempt.status !== 'in_progress') return null;

  const graded = await gradeAnswers(attemptId);
  const score = scoreAttempt(graded.map((item) => item.isCorrect), row.exam.passPercent);
  if (!(await closeAttempt(row.attempt, graded, score))) return null;
  await announce(row.attempt, row.exam, score);
  return score;
}

/** Grades attempts whose time ran out while nobody was looking at them. */
export async function sweepExpiredAttempts(): Promise<number> {
  const cutoff = new Date(Date.now() - DEADLINE_GRACE_MS);
  const overdue = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(and(eq(examAttempts.status, 'in_progress'), lt(examAttempts.expiresAt, cutoff)))
    .limit(200);
  for (const attempt of overdue) await finalizeAttempt(attempt.id);
  return overdue.length;
}
