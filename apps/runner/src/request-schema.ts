import { LAB_LANGUAGES, MAX_LAB_FIXTURES } from '@mettle/shared';
import { z } from 'zod';

const KB = 1024;
const MAX_FIXTURE_BYTES = 1024 * KB;

const fixture = z.object({
  /** Fixtures live under data/ so they can never shadow a harness file. */
  path: z.string().regex(/^data\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/).max(99),
  content: z.string().max(512 * KB),
});

const test = z.object({
  id: z.string().min(1).max(64),
  name: z.string().max(200),
  code: z.string().max(64 * KB),
});

export const executeSchema = z
  .object({
    language: z.enum(LAB_LANGUAGES),
    code: z.string().max(128 * KB),
    fixtures: z.array(fixture).max(MAX_LAB_FIXTURES),
    tests: z.array(test).min(1).max(24),
    timeLimitMs: z.number().int().min(500).max(15_000),
    memoryMb: z.number().int().min(32).max(2048),
  })
  .refine((body) => body.fixtures.reduce((sum, f) => sum + f.content.length, 0) <= MAX_FIXTURE_BYTES, {
    message: 'Fixtures are too large',
  })
  .refine((body) => !body.fixtures.some((f) => f.path.split('/').includes('..')), {
    message: 'Fixture paths may not contain ..',
  });
