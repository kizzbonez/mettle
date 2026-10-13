import { describe, expect, it } from 'vitest';
import { axisTicks, nearestIndex, plotBox, pointX, shortDay, valueY } from './scale';

describe('axisTicks', () => {
  it('starts at zero and covers the maximum in round steps', () => {
    expect(axisTicks(23)).toEqual([0, 10, 20, 30]);
    expect(axisTicks(26)).toEqual([0, 10, 20, 30]);
    expect(axisTicks(100)).toEqual([0, 50, 100]);
    expect(axisTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(axisTicks(1300)).toEqual([0, 500, 1000, 1500]);
  });

  it('counts in whole numbers when the data is tiny', () => {
    expect(axisTicks(0)).toEqual([0, 1]);
    expect(axisTicks(2)).toEqual([0, 1, 2]);
    expect(axisTicks(3, 2)).toEqual([0, 2, 4]);
  });
});

describe('plot geometry', () => {
  const box = plotBox(400, 200, { top: 10, right: 20, bottom: 30, left: 40 });

  it('computes the plotting area from the margins', () => {
    expect(box).toMatchObject({ left: 40, right: 380, top: 10, bottom: 170, width: 340, height: 160 });
  });

  it('spreads points from edge to edge', () => {
    expect(pointX(box, 0, 5)).toBe(40);
    expect(pointX(box, 4, 5)).toBe(380);
    expect(pointX(box, 0, 1)).toBe(210);
  });

  it('puts zero on the baseline and the maximum at the top', () => {
    expect(valueY(box, 0, 50)).toBe(170);
    expect(valueY(box, 50, 50)).toBe(10);
    expect(valueY(box, 5, 0)).toBe(170);
  });

  it('finds the nearest point and stays in range', () => {
    expect(nearestIndex(box, 40, 5)).toBe(0);
    expect(nearestIndex(box, 210, 5)).toBe(2);
    expect(nearestIndex(box, 9999, 5)).toBe(4);
    expect(nearestIndex(box, -50, 5)).toBe(0);
  });
});

describe('shortDay', () => {
  it('formats an ISO day without shifting it across time zones', () => {
    expect(shortDay('2026-10-13')).toBe('Oct 13');
    expect(shortDay('2026-01-01')).toBe('Jan 1');
  });
});
