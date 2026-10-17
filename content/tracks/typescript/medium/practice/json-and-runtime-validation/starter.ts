// Community Fridge Donations
//
// Donation is complete. Write the Parsed<T> type and the three functions. JSON.parse returns
// `any`: store what it gives you as `unknown` and narrow it step by step, with no `as`.

export interface Donation {
  donor: string;
  item: string;
  portions: number;
  bestBefore: Date;
  allergens: string[];
}

// Task 1: a discriminated union on `ok`.
export type Parsed<T> = unknown;

// Task 2
export function isStringArray(value: unknown): value is string[] {
  throw new Error("Not implemented");
}

// Task 3
export function parseDay(text: string): Date | undefined {
  throw new Error("Not implemented");
}

// Task 4
export function parseDonation(text: string): Parsed<Donation> {
  throw new Error("Not implemented");
}
