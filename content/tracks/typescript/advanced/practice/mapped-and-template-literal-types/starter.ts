// Coffee Shop Till
//
// The types below are placeholders that are far too loose. Replace each one with the mapped or
// template literal type the instructions describe, then write the body of makeSetters.

/** The cup sizes the shop sells. Complete: do not change it. */
export type CupSize = "small" | "medium" | "large";

/** TODO 1: every property optional and writable, with the same type. */
export type Patch<T> = T;

/** TODO 2: set<Key>(value) for every string key whose type is not a function. */
export type Setters<T> = Record<string, (value: never) => void>;

/** TODO 3: setters that assign to the target's own non-function properties. */
export function makeSetters<T extends object>(target: T): Setters<T> {
  throw new Error("Not implemented");
}

/** TODO 4: { size, drink } for a ticket "SIZE-DRINK" whose SIZE is a CupSize, otherwise never. */
export type TicketParts<S extends string> = { size: string; drink: string };
