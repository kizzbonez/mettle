/** Pure geometry for the charts: nothing here touches the DOM. */

/** A whole-number step that is easy to read: 1, 2, 5, 10, 20, 50, ... */
function roundStep(raw: number): number {
  if (raw <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const factor = [1, 2, 5, 10].find((candidate) => candidate * magnitude >= raw) ?? 10;
  return factor * magnitude;
}

/**
 * Axis values from 0 up to the first round number that covers `max`, in
 * round steps: about `count` intervals, never fractions of a count.
 */
export function axisTicks(max: number, count = 4): number[] {
  const step = roundStep(max / count);
  const intervals = Math.max(1, Math.ceil(max / step));
  return Array.from({ length: intervals + 1 }, (_, i) => i * step);
}

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/** The plotting area inside an SVG of the given size. */
export function plotBox(width: number, height: number, margin: { top: number; right: number; bottom: number; left: number }): Box {
  const left = margin.left;
  const right = Math.max(left + 1, width - margin.right);
  const top = margin.top;
  const bottom = height - margin.bottom;
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}

/** X position of the i-th of `count` points spread across the box. */
export function pointX(box: Box, index: number, count: number): number {
  return count <= 1 ? box.left + box.width / 2 : box.left + (index / (count - 1)) * box.width;
}

export function valueY(box: Box, value: number, max: number): number {
  return box.bottom - (max === 0 ? 0 : (value / max) * box.height);
}

/** The data index nearest to a pointer position, for hover. */
export function nearestIndex(box: Box, x: number, count: number): number {
  if (count <= 1) return 0;
  const ratio = (x - box.left) / box.width;
  return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
}

/** "2026-10-13" -> "Oct 13". */
export function shortDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
