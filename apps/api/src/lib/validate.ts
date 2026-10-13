import { z } from 'zod';
import { HttpError } from './errors';

/** Parses input or throws a 400 whose details map field names to messages. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  throw new HttpError(400, 'validation_failed', 'Please check the highlighted fields.', { fields });
}

/**
 * Parses a PATCH body and keeps only the fields that were sent. `.partial()`
 * alone is not enough: a field with a default is still filled in when it is
 * missing, which would reset it on every partial update.
 */
export function parsePatch<S extends z.ZodObject>(schema: S, data: unknown): Partial<z.infer<S>> {
  const parsed: Record<string, unknown> = parse(schema.partial(), data);
  const sent = new Set(Object.keys(data as object));
  return Object.fromEntries(Object.entries(parsed).filter(([key]) => sent.has(key))) as Partial<z.infer<S>>;
}

export const uuidParam = z.object({ id: z.uuid() });

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(254));

/**
 * bcrypt reads at most 72 bytes of a password, so anything longer would be
 * silently truncated. Refusing it is more honest than accepting it.
 */
export const passwordField = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Use at most 72 characters.')
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), 'Include at least one letter and one number.');

export const displayNameField = z.string().trim().min(2, 'Enter your name.').max(80);

/** Adds a `confirmPassword` check to an object that has `password`. */
export function withConfirmation<T extends { password: string; confirmPassword: string }>(
  schema: z.ZodType<T>,
): z.ZodType<T> {
  return schema.refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The passwords do not match.',
  });
}
