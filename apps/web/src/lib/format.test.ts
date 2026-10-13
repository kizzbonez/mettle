import { describe, expect, it } from 'vitest';
import { formatClock, formatDuration, formatPercent, initials, plural, timeAgo } from './format';

describe('formatClock', () => {
  it('pads minutes and seconds', () => {
    expect(formatClock(125)).toBe('02:05');
    expect(formatClock(0)).toBe('00:00');
  });

  it('adds hours only when needed', () => {
    expect(formatClock(3725)).toBe('1:02:05');
  });

  it('never goes negative', () => {
    expect(formatClock(-30)).toBe('00:00');
  });
});

describe('formatDuration', () => {
  it('switches from milliseconds to seconds at one second', () => {
    expect(formatDuration(754)).toBe('754 ms');
    expect(formatDuration(1840)).toBe('1.84 s');
  });

  it('is empty when there is no measurement', () => {
    expect(formatDuration(null)).toBe('');
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');

  it('describes recent moments', () => {
    expect(timeAgo('2026-10-13T11:59:40Z', now)).toBe('just now');
    expect(timeAgo('2026-10-13T09:00:00Z', now)).toBe('3 hours ago');
    expect(timeAgo('2026-10-12T12:00:00Z', now)).toBe('yesterday');
  });

  it('handles a missing value', () => {
    expect(timeAgo(null, now)).toBe('never');
  });
});

describe('small helpers', () => {
  it('formats percentages and blanks', () => {
    expect(formatPercent(66.67)).toBe('67%');
    expect(formatPercent(null)).toBe('–');
  });

  it('pluralizes', () => {
    expect(plural(1, 'lesson')).toBe('1 lesson');
    expect(plural(3, 'lesson')).toBe('3 lessons');
    expect(plural(2, 'entry', 'entries')).toBe('2 entries');
  });

  it('takes initials from the first and last name', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('Grace Brewster Hopper')).toBe('GH');
    expect(initials('Plato')).toBe('P');
  });
});
