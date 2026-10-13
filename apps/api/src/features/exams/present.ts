import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { attemptQuestions, examAttempts, exams, questionOptions, questions } from '../../db/schema/assessment';
import { notFound } from '../../lib/errors';

type OptionRow = typeof questionOptions.$inferSelect;

async function optionsById(questionIds: string[]): Promise<Map<string, OptionRow>> {
  if (questionIds.length === 0) return new Map();
  const rows = await db.select().from(questionOptions).where(inArray(questionOptions.questionId, questionIds));
  return new Map(rows.map((row) => [row.id, row]));
}

/** One attempt owned by `userId`, or a 404: another learner's attempt does not exist. */
export async function ownedAttempt(attemptId: string, userId: string) {
  const [row] = await db
    .select({ attempt: examAttempts, exam: exams })
    .from(examAttempts)
    .innerJoin(exams, eq(exams.id, examAttempts.examId))
    .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.userId, userId)))
    .limit(1);
  if (!row) throw notFound('Attempt');
  return row;
}

/**
 * The attempt as the browser may see it. While it is in progress the payload
 * holds no hint of which options are correct and no explanations; both are
 * added only once the attempt is closed.
 */
export async function presentAttempt(attemptId: string, userId: string) {
  const { attempt, exam } = await ownedAttempt(attemptId, userId);
  const dealt = await db
    .select({ item: attemptQuestions, question: questions })
    .from(attemptQuestions)
    .innerJoin(questions, eq(questions.id, attemptQuestions.questionId))
    .where(eq(attemptQuestions.attemptId, attemptId))
    .orderBy(asc(attemptQuestions.sortOrder));
  const options = await optionsById(dealt.map((row) => row.question.id));
  const closed = attempt.status !== 'in_progress';

  return {
    id: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    submittedAt: attempt.submittedAt,
    /** The page counts down against this, so a wrong device clock does not matter. */
    serverNow: new Date(),
    exam: { id: exam.id, title: exam.title, courseId: exam.courseId, passPercent: exam.passPercent, timeLimitMinutes: exam.timeLimitMinutes },
    result: closed
      ? { correct: attempt.correctCount, total: attempt.totalCount, percent: attempt.scorePercent, passed: attempt.passed }
      : null,
    questions: dealt.map(({ item, question }) => ({
      id: item.id,
      type: question.type,
      promptMd: question.promptMd,
      selectedOptionIds: item.selectedOptionIds,
      flagged: item.flagged,
      options: item.optionOrder
        .map((id) => options.get(id))
        .filter((option): option is OptionRow => option !== undefined)
        .map((option) => ({ id: option.id, bodyMd: option.bodyMd, ...(closed ? { isCorrect: option.isCorrect } : {}) })),
      ...(closed ? { isCorrect: item.isCorrect, explanationMd: question.explanationMd } : {}),
    })),
  };
}
