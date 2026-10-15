import { MAX_LAB_FIXTURES } from '@mettle/shared';
import { describe, expect, it } from 'vitest';
import { executeSchema } from './request-schema';

function request(fixtureCount: number) {
  const fixtures = Array.from({ length: fixtureCount }, (_, i) => ({ path: `data/file-${i}.txt`, content: 'x' }));
  return { language: 'python', code: 'x = 1\n', fixtures, tests: [{ id: '1', name: 'one', code: 'assert x == 1' }], timeLimitMs: 5000, memoryMb: 256 };
}

describe('execute request', () => {
  it('accepts a lab with many fixture files, up to the shared limit', () => {
    expect(executeSchema.safeParse(request(17)).success).toBe(true);
    expect(executeSchema.safeParse(request(MAX_LAB_FIXTURES)).success).toBe(true);
  });

  it('refuses more fixture files than the limit', () => {
    expect(executeSchema.safeParse(request(MAX_LAB_FIXTURES + 1)).success).toBe(false);
  });

  it('refuses a fixture path that climbs out of data/', () => {
    const body = { ...request(1), fixtures: [{ path: 'data/../solution.py', content: 'x' }] };
    expect(executeSchema.safeParse(body).success).toBe(false);
  });
});
