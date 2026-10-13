import { describe, expect, it } from 'vitest';
import { secondsRemaining } from './use-countdown';

describe('secondsRemaining', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');

  it('counts whole seconds until the deadline, rounding up', () => {
    expect(secondsRemaining('2026-10-13T12:10:00Z', 0, now)).toBe(600);
    expect(secondsRemaining('2026-10-13T12:00:00.400Z', 0, now)).toBe(1);
  });

  it('never goes below zero', () => {
    expect(secondsRemaining('2026-10-13T11:59:00Z', 0, now)).toBe(0);
  });

  it('follows the server clock, not the device clock', () => {
    // The device is five minutes slow. Without the offset it would show 15 minutes.
    const offset = 5 * 60_000;
    expect(secondsRemaining('2026-10-13T12:15:00Z', offset, now)).toBe(600);
    // The device is five minutes fast: the learner still gets the full time.
    expect(secondsRemaining('2026-10-13T12:10:00Z', -offset, now)).toBe(900);
  });
});
