import { DIFFICULTIES, PUBLISH_STATUSES } from '@mettle/shared';
import { z } from 'zod';

/** Field definitions shared by the content forms. */

export const slugField = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.')
  .max(80);

export const titleField = z.string().trim().min(2, 'Enter a title.').max(160);
export const statusField = z.enum(PUBLISH_STATUSES);
export const difficultyField = z.enum(DIFFICULTIES);
export const sortOrderField = z.number().int().min(0).max(10_000);
export const markdownField = z.string().max(100_000);
export const stringList = z.array(z.string().trim().min(1).max(300)).max(20);
