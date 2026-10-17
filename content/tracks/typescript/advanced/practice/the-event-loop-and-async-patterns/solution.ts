/**
 * Washes every load with at most `machines` washes at once and resolves with the results in the
 * order of `loads`. Stops starting new loads once `signal` is aborted.
 */
export async function washAll<T, R>(
  loads: readonly T[],
  machines: number,
  wash: (load: T) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  if (!Number.isInteger(machines) || machines < 1) {
    throw new RangeError(`machines must be a whole number of at least 1, got ${machines}`);
  }
  signal?.throwIfAborted();
  const results: R[] = new Array(loads.length);
  let next = 0;
  async function runMachine(): Promise<void> {
    while (next < loads.length) {
      signal?.throwIfAborted();
      const index = next++;
      results[index] = await wash(loads[index]);
    }
  }
  const workers = Array.from({ length: Math.min(machines, loads.length) }, () => runMachine());
  await Promise.all(workers);
  return results;
}

/** Yields the items of `source` in arrays of `size`, pulling items only as they are needed. */
export async function* bundles<T>(source: AsyncIterable<T>, size: number): AsyncGenerator<T[]> {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`size must be a whole number of at least 1, got ${size}`);
  }
  let bundle: T[] = [];
  for await (const item of source) {
    bundle.push(item);
    if (bundle.length === size) {
      yield bundle;
      bundle = [];
    }
  }
  if (bundle.length > 0) yield bundle;
}
