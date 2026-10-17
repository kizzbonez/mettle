// Cafe Bill Splitter, migrated
//
// The TypeScript version of data/split-bill.js. Every placeholder below type-checks but
// accepts far too much: replace each with the type its JSDoc meant, then port the bodies.

// Step 1: make Service an `as const` object, and the type Service the union of its values.
export const Service = { POOR: "poor", GOOD: "good", GREAT: "great" };
export type Service = string;

// Step 2: read-only, with exactly one rate for each Service.
export const TIP_PERCENT = { poor: 5, good: 10, great: 15 };

// Step 3: the shape of one diner's share, with read-only fields.
export type Share = unknown;

// Step 4: the three functions, with the parameter and return types from the instructions.
export function splitBill(totalCents: unknown, diners: unknown, service: unknown, roundTo?: unknown): unknown {
  throw new Error("Not implemented");
}

export function receipt(shares: unknown, format: unknown): unknown {
  throw new Error("Not implemented");
}

export function totalOf(shares: unknown): unknown {
  throw new Error("Not implemented");
}
