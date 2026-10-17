// Cafe Bill Splitter, migrated
//
// The TypeScript version of data/split-bill.js, with the JSDoc types that TypeScript 7 no
// longer accepts (@enum, a value used as a type, a Closure function type) rewritten.

// @enum becomes an `as const` object and a union type of the same name.
export const Service = { POOR: "poor", GOOD: "good", GREAT: "great" } as const;
export type Service = (typeof Service)[keyof typeof Service];

export const TIP_PERCENT: Readonly<Record<Service, number>> = { poor: 5, good: 10, great: 15 };

// @typedef becomes an interface.
export interface Share {
  readonly diner: string;
  readonly cents: number;
}

export function splitBill(totalCents: number, diners: readonly string[], service: Service, roundTo = 1): Share[] {
  if (diners.length === 0) throw new RangeError("nobody to split the bill between");
  const withTip = Math.round((totalCents * (100 + TIP_PERCENT[service])) / 100);
  const each = Math.ceil(withTip / diners.length / roundTo) * roundTo;
  return diners.map((diner) => ({ diner, cents: each }));
}

// function(Share): string becomes an arrow function type.
export function receipt(shares: readonly Share[], format: (share: Share) => string): string {
  return shares.map((share) => format(share)).join("\n");
}

export function totalOf(shares: readonly Share[]): number {
  return shares.reduce((sum, share) => sum + share.cents, 0);
}
