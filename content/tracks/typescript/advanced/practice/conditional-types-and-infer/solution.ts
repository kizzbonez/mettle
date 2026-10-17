/** T itself for an array type (readonly or not), T[] otherwise; distributes over unions. */
export type AsList<T> = T extends readonly unknown[] ? T : T[];

/** The same array for an array, a new one-item array otherwise. */
export function asList<T>(value: T): AsList<T> {
  if (Array.isArray(value)) return value as AsList<T>;
  return [value] as AsList<T>;
}

/** Unwraps promises, however deeply nested. */
export type Resolved<T> = T extends PromiseLike<infer V> ? Resolved<V> : T;

/** The return type of a function, with promises unwrapped. */
export type HandlerResult<F extends (...args: never[]) => unknown> = F extends (...args: never[]) => infer R
  ? Resolved<R>
  : never;

/** true for never, false for every other type. */
export type IsNever<T> = [T] extends [never] ? true : false;
