import { and, asc, count, eq, gt, inArray, ne } from 'drizzle-orm';
import { db, type Tx } from '../../db/client';
import { attemptQuestions, examAttempts, questionOptions, questions } from '../../db/schema/assessment';
import { conflict } from '../../lib/errors';
import { drawQuestionIds, type ExamRow } from './generate';
import { shuffle } from './grade';

/** Option ids for each question, in the order this attempt will show them. */
async function optionOrders(questionIds: string[], shuffled: boolean, tx: Tx): Promise<Map<string, string[]>> {
  const rows = await tx
    .select({ id: questionOptions.id, questionId: questionOptions.questionId, type: questions.type })
    .from(questionOptions)
    .innerJoin(questions, eq(questions.id, questionOptions.questionId))
    .where(inArray(questionOptions.questionId, questionIds))
    .orderBy(asc(questionOptions.sortOrder));
  const grouped = new Map<string, { ids: string[]; keepOrder: boolean }>();
  for (const row of rows) {
    const entry = grouped.get(row.questionId) ?? { ids: [], keepOrder: row.type === 'true_false' };
    entry.ids.push(row.id);
    grouped.set(row.questionId, entry);
  }
  const orders = new Map<string, string[]>();
  // True/False always reads "True, False"; shuffling it only confuses.
  for (const [id, entry] of grouped) orders.set(id, shuffled && !entry.keepOrder ? shuffle(entry.ids) : entry.ids);
  return orders;
}

async function assertAttemptsLeft(userId: string, exam: ExamRow, tx: Tx): Promise<void> {
  if (exam.maxAttempts === null) return;
  const [row] = await tx
    .select({ used: count() })
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, exam.id), eq(examAttempts.userId, userId), ne(examAttempts.status, 'in_progress')));
  if (Number(row?.used ?? 0) >= exam.maxAttempts) {
    throw conflict(`You have used all ${exam.maxAttempts} attempts for this exam.`, 'no_attempts_left');
  }
}

async function deal(userId: string, exam: ExamRow, tx: Tx): Promise<string> {
  const questionIds = await drawQuestionIds(exam, tx);
  if (questionIds.length === 0) throw conflict('This exam has no questions yet.', 'exam_empty');
  const orders = await optionOrders(questionIds, exam.shuffleOptions, tx);
  const [attempt] = await tx
    .insert(examAttempts)
    .values({
      examId: exam.id,
      userId,
      totalCount: questionIds.length,
      expiresAt: new Date(Date.now() + exam.timeLimitMinutes * 60_000),
    })
    .returning({ id: examAttempts.id });
  if (!attempt) throw new Error('Could not create the attempt');
  await tx.insert(attemptQuestions).values(
    questionIds.map((questionId, index) => ({
      attemptId: attempt.id,
      questionId,
      sortOrder: index,
      optionOrder: orders.get(questionId) ?? [],
    })),
  );
  return attempt.id;
}

/**
 * Starts an attempt, or returns the one already running. A learner can have
 * only one live attempt per exam, so a double click or a second tab cannot
 * deal a second paper.
 */
export async function startAttempt(userId: string, exam: ExamRow): Promise<string> {
  return db.transaction(async (tx) => {
    const [live] = await tx
      .select({ id: examAttempts.id })
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.examId, exam.id),
          eq(examAttempts.userId, userId),
          eq(examAttempts.status, 'in_progress'),
          gt(examAttempts.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (live) return live.id;
    await assertAttemptsLeft(userId, exam, tx);
    return deal(userId, exam, tx);
  });
}
