import { describe, expect, it } from 'vitest';
import { lockDurationMs, lockedForSeconds } from './lockout';

describe('lockDurationMs', () => {
  it('does not lock for the first four mistakes', () => {
    expect([1, 2, 3, 4].map(lockDurationMs)).toEqual([0, 0, 0, 0]);
  });

  it('starts at 30 seconds and doubles', () => {
    expect([5, 6, 7, 8].map(lockDurationMs)).toEqual([30_000, 60_000, 120_000, 240_000]);
  });

  it('never exceeds 15 minutes', () => {
    expect(lockDurationMs(10)).toBe(15 * 60_000);
    expect(lockDurationMs(500)).toBe(15 * 60_000);
  });
});

describe('lockedForSeconds', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');

  it('is zero when there is no lock or the lock has passed', () => {
    expect(lockedForSeconds({ lockedUntil: null }, now)).toBe(0);
    expect(lockedForSeconds({ lockedUntil: new Date(now - 1) }, now)).toBe(0);
  });

  it('rounds the remaining time up', () => {
    expect(lockedForSeconds({ lockedUntil: new Date(now + 1500) }, now)).toBe(2);
  });
});
