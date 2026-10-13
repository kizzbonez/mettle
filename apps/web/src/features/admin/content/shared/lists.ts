/** Small, non-mutating edits to the row lists in the forms (options, rules, fixtures, tests, pinned questions). */

/** Moves the item at `index` one place up (-1) or down (+1). Out of range is a no-op. */
export function move<T>(items: T[], index: number, by: -1 | 1): T[] {
  const target = index + by;
  if (index < 0 || target < 0 || index >= items.length || target >= items.length) return items;
  const next = [...items];
  next.splice(target, 0, ...next.splice(index, 1));
  return next;
}

export function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, position) => position !== index);
}

export function patchAt<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, position) => (position === index ? { ...item, ...patch } : item));
}
