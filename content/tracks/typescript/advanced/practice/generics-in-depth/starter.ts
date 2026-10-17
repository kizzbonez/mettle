// Bike Rental Helpers
//
// The three functions below compile, but their types are too loose. Fix each signature as the
// TODO asks, then replace every `throw new Error("Not implemented")` with the real code.

/** One bike of the fleet. Complete: do not change it. */
export interface Bike {
  id: string;
  size: "S" | "M" | "L";
  electric: boolean;
  dailyRate: number;
}

/** Groups the items by their value at `key`, in the order each value first appears. */
// TODO 1: make the key a type parameter tied to T, and return Map<T[K], T[]>.
export function groupBy<T>(items: readonly T[], key: keyof T): Map<unknown, T[]> {
  throw new Error("Not implemented");
}

/** The requested choice when it is one of `choices`, otherwise the fallback. */
// TODO 2: C must come from `choices` only, so a fallback that is not a choice is rejected.
export function pickOr<C extends string>(choices: readonly C[], requested: string | undefined, fallback: C): C {
  throw new Error("Not implemented");
}

/** The stops of the guided ride, in order. Throws when a stop appears twice. */
// TODO 3: keep the literal tuple type of an array literal passed in.
export function tourStops<T extends readonly string[]>(stops: T): T {
  throw new Error("Not implemented");
}
