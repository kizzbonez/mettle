import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { HttpError } from './errors';
import { parsePatch } from './validate';

const body = z.object({
  title: z.string().trim().min(2),
  summary: z.string().trim().default(''),
  sortOrder: z.number().int().default(0),
});

describe('parsePatch', () => {
  it('returns only the fields that were sent', () => {
    expect(parsePatch(body, { title: '  Ownership ' })).toEqual({ title: 'Ownership' });
    expect(parsePatch(body, {})).toEqual({});
  });

  it('keeps a field sent with the same value as its default', () => {
    expect(parsePatch(body, { summary: '', sortOrder: 0 })).toEqual({ summary: '', sortOrder: 0 });
  });

  it('still validates what was sent, and drops unknown fields', () => {
    expect(() => parsePatch(body, { title: 'x' })).toThrow(HttpError);
    expect(() => parsePatch(body, null)).toThrow(HttpError);
    expect(parsePatch(body, { role: 'admin', sortOrder: 4 })).toEqual({ sortOrder: 4 });
  });
});
