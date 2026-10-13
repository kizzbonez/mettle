import { describe, expect, it } from 'vitest';
import { pageWindow } from './pagination';

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it('keeps the ends and a window around the current page', () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 'gap', 20]);
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
    expect(pageWindow(20, 20)).toEqual([1, 'gap', 19, 20]);
  });

  it('does not show a gap where the pages are adjacent', () => {
    expect(pageWindow(3, 20)).toEqual([1, 2, 3, 4, 'gap', 20]);
    expect(pageWindow(18, 20)).toEqual([1, 'gap', 17, 18, 19, 20]);
  });
});
