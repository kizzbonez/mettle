import { QUESTION_TYPES } from '@mettle/shared';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { Tx } from '../../../db/client';
import { questionOptions, questions } from '../../../db/schema/assessment';
import { difficultyField, markdownField, statusField } from './fields';

const optionBody = z.object({
  /** Present for an option that already exists, so its id (used by past attempts) is kept. */
  id: z.uuid().optional(),
  bodyMd: z.string().trim().min(1, 'An option cannot be empty.').max(2000),
  isCorrect: z.boolean(),
});

export const questionBody = z
  .object({
    trackId: z.uuid().nullable(),
    categoryId: z.uuid().nullable(),
    difficulty: difficultyField,
    type: z.enum(QUESTION_TYPES),
    promptMd: markdownField.min(5, 'Write the question.'),
    explanationMd: markdownField.default(''),
    tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
    status: statusField.default('draft'),
    options: z.array(optionBody).min(2, 'Add at least two options.').max(8),
  })
  .superRefine((question, ctx) => {
    const correct = question.options.filter((option) => option.isCorrect).length;
    if (question.type === 'multiple' ? correct < 2 : correct !== 1) {
      const need = question.type === 'multiple' ? 'at least two correct options' : 'exactly one correct option';
      ctx.addIssue({ code: 'custom', path: ['options'], message: `This question type needs ${need}.` });
    }
    if (question.type === 'true_false' && question.options.length !== 2) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'A true/false question has exactly two options.' });
    }
  });

export type QuestionInput = z.infer<typeof questionBody>;

/**
 * Brings a question's options in line with `wanted`: existing options are
 * updated in place, new ones inserted, and ones no longer listed removed.
 * Updating in place matters: past attempts refer to options by id.
 */
export async function saveOptions(questionId: string, wanted: QuestionInput['options'], tx: Tx): Promise<void> {
  const owned = await tx.select({ id: questionOptions.id }).from(questionOptions).where(eq(questionOptions.questionId, questionId));
  const ownedIds = new Set(owned.map((row) => row.id));
  const kept = new Set(wanted.map((option) => option.id).filter((id): id is string => id !== undefined && ownedIds.has(id)));
  const stale = [...ownedIds].filter((id) => !kept.has(id));
  if (stale.length > 0) await tx.delete(questionOptions).where(inArray(questionOptions.id, stale));

  for (const [sortOrder, option] of wanted.entries()) {
    const values = { bodyMd: option.bodyMd, isCorrect: option.isCorrect, sortOrder };
    if (option.id && kept.has(option.id)) await tx.update(questionOptions).set(values).where(eq(questionOptions.id, option.id));
    else await tx.insert(questionOptions).values({ questionId, ...values });
  }
}

export async function insertQuestion(input: QuestionInput, createdBy: string, tx: Tx): Promise<string> {
  const { options, ...values } = input;
  const [row] = await tx.insert(questions).values({ ...values, createdBy }).returning({ id: questions.id });
  if (!row) throw new Error('Could not create the question');
  await saveOptions(row.id, options, tx);
  return row.id;
}
