import { and, asc, eq, notInArray, sql, type SQL } from 'drizzle-orm';
import type { DbOrTx } from '../../db/client';
import { examQuestions, examRules, type exams, questions } from '../../db/schema/assessment';
import { shuffle } from './grade';

export type ExamRow = typeof exams.$inferSelect;
type RuleRow = typeof examRules.$inferSelect;

const published = eq(questions.status, 'published');

function ruleFilters(rule: RuleRow, alreadyChosen: string[]): SQL[] {
  const filters: SQL[] = [published];
  if (rule.trackId) filters.push(eq(questions.trackId, rule.trackId));
  if (rule.categoryId) filters.push(eq(questions.categoryId, rule.categoryId));
  if (rule.difficulty) filters.push(eq(questions.difficulty, rule.difficulty));
  if (rule.tag) filters.push(sql`${questions.tags} @> ARRAY[${rule.tag}]::text[]`);
  if (alreadyChosen.length > 0) filters.push(notInArray(questions.id, alreadyChosen));
  return filters;
}

async function drawFixed(examId: string, tx: DbOrTx): Promise<string[]> {
  const rows = await tx
    .select({ id: examQuestions.questionId })
    .from(examQuestions)
    .innerJoin(questions, eq(questions.id, examQuestions.questionId))
    .where(and(eq(examQuestions.examId, examId), published))
    .orderBy(asc(examQuestions.sortOrder));
  return rows.map((row) => row.id);
}

/**
 * Samples a paper from the bank. Each rule takes `count` random published
 * questions matching its filters, never repeating one an earlier rule took.
 * The filter columns are indexed, so only the matching pool is sorted.
 */
async function drawDynamic(examId: string, tx: DbOrTx): Promise<string[]> {
  const rules = await tx.select().from(examRules).where(eq(examRules.examId, examId)).orderBy(asc(examRules.sortOrder));
  const chosen: string[] = [];
  for (const rule of rules) {
    const rows = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(and(...ruleFilters(rule, chosen)))
      .orderBy(sql`random()`)
      .limit(rule.count);
    chosen.push(...rows.map((row) => row.id));
  }
  return shuffle(chosen);
}

/** The question ids for one new attempt, in the order they will be shown. */
export function drawQuestionIds(exam: Pick<ExamRow, 'id' | 'mode'>, tx: DbOrTx): Promise<string[]> {
  return exam.mode === 'fixed' ? drawFixed(exam.id, tx) : drawDynamic(exam.id, tx);
}

/** How many questions a learner will get, without drawing them. */
export async function plannedQuestionCount(exam: Pick<ExamRow, 'id' | 'mode'>, tx: DbOrTx): Promise<number> {
  if (exam.mode === 'fixed') return (await drawFixed(exam.id, tx)).length;
  const [row] = await tx
    .select({ total: sql<number>`coalesce(sum(${examRules.count}), 0)` })
    .from(examRules)
    .where(eq(examRules.examId, exam.id));
  return Number(row?.total ?? 0);
}
