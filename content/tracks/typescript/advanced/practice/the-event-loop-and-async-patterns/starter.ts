// Laundromat Run
//
// Keep both signatures. Replace each `throw new Error("Not implemented")` with the real code.

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
  throw new Error("Not implemented");
}

/** Yields the items of `source` in arrays of `size`, pulling items only as they are needed. */
export async function* bundles<T>(source: AsyncIterable<T>, size: number): AsyncGenerator<T[]> {
  throw new Error("Not implemented");
}
