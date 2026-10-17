// Grocery Delivery Types
//
// Every type below is a placeholder that is far too loose. Replace each one with the
// conditional type the instructions describe, then write the body of asList.

/** TODO 1: T itself for an array type (readonly or not), T[] otherwise; distributes over unions. */
export type AsList<T> = unknown[];

/** TODO 2: the same array for an array, a new one-item array otherwise. */
export function asList<T>(value: T): AsList<T> {
  throw new Error("Not implemented");
}

/** TODO 3: unwraps promises, however deeply nested. */
export type Resolved<T> = unknown;

/** TODO 4: the return type of a function, with promises unwrapped. Only accept function types. */
export type HandlerResult<F> = unknown;

/** TODO 5: true for never, false for every other type. */
export type IsNever<T> = boolean;
