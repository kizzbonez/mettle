import type { Difficulty } from '@mettle/shared';
import { asc, eq } from 'drizzle-orm';
import type { Tx } from '../db/client';
import { categories, questionOptions, questions } from '../db/schema/assessment';
import type { ContentQuestion } from './types';

const titleCase = (slug: string) => slug.replace(/(^|-)([a-z])/g, (_, dash: string, char: string) => (dash ? ' ' : '') + char.toUpperCase());

/** Finds or creates a category by slug and returns its id. */
export async function categoryId(slug: string, tx: Tx, cache: Map<string, string>): Promise<string> {
  const known = cache.get(slug);
  if (known) return known;
  await tx.insert(categories).values({ slug, name: titleCase(slug) }).onConflictDoNothing({ target: categories.slug });
  const [row] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!row) throw new Error(`Could not create category ${slug}`);
  cache.set(slug, row.id);
  return row.id;
}

/**
 * Replaces a question's options only when they really changed. Option ids are
 * referenced by past attempts, so rewriting identical options would break the
 * review of every exam already sat.
 */
async function syncOptions(questionId: string, wanted: ContentQuestion['options'], tx: Tx): Promise<void> {
  const current = await tx
    .select({ bodyMd: questionOptions.bodyMd, isCorrect: questionOptions.isCorrect })
    .from(questionOptions)
    .where(eq(questionOptions.questionId, questionId))
    .orderBy(asc(questionOptions.sortOrder));
  const same =
    current.length === wanted.length &&
    current.every((option, i) => option.bodyMd === wanted[i]?.text.trim() && option.isCorrect === wanted[i]?.correct);
  if (same) return;
  await tx.delete(questionOptions).where(eq(questionOptions.questionId, questionId));
  await tx.insert(questionOptions).values(
    wanted.map((option, sortOrder) => ({ questionId, bodyMd: option.text.trim(), isCorrect: option.correct, sortOrder })),
  );
}

export interface QuestionContext {
  trackId: string;
  difficulty: Difficulty;
  defaultCategory: string;
  categories: Map<string, string>;
}

/** Inserts or updates one question, matched by its stable `key`. */
export async function upsertQuestion(question: ContentQuestion, context: QuestionContext, tx: Tx): Promise<void> {
  const values = {
    key: question.key,
    trackId: context.trackId,
    categoryId: await categoryId(question.category ?? context.defaultCategory, tx, context.categories),
    difficulty: context.difficulty,
    type: question.type,
    promptMd: question.prompt.trim(),
    explanationMd: question.explanation.trim(),
    tags: question.tags,
    status: 'published' as const,
  };
  const [row] = await tx
    .insert(questions)
    .values(values)
    .onConflictDoUpdate({ target: questions.key, set: { ...values, updatedAt: new Date() } })
    .returning({ id: questions.id });
  if (!row) throw new Error(`Could not save question ${question.key}`);
  await syncOptions(row.id, question.options, tx);
}
