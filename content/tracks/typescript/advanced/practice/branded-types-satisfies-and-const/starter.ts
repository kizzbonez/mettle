// Parcel Courier Prices
//
// Follow the TODOs: brand the two number types, check weights in toGrams, keep the literal
// types of SERVICES with `as const satisfies`, and compute the price in quote.

/** A symbol that exists only for the compiler, used to brand types. */
declare const brand: unique symbol;

// TODO 1: brand both types, so plain numbers and the other brand are rejected.
export type Grams = number;
export type Cents = number;

/** TODO 2: a whole, safe number of grams, at least 1; anything else throws a RangeError. */
export function toGrams(amount: number): Grams {
  throw new Error("Not implemented");
}

/** What a service costs and how long it takes. Complete: do not change it. */
export interface ServiceInfo {
  readonly centsPerKg: number;
  readonly days: number;
}

// TODO 3: this annotation loses the keys and the numbers. Use `as const satisfies` instead.
export const SERVICES: Record<string, ServiceInfo> = {
  economy: { centsPerKg: 250, days: 5 },
  standard: { centsPerKg: 400, days: 3 },
  express: { centsPerKg: 950, days: 1 },
};

/** 4: the names of the services, derived from SERVICES: right once TODO 3 is done. */
export type ServiceName = keyof typeof SERVICES;

/** TODO 5: the price in cents, charging every started kilogram in full. */
export function quote(service: ServiceName, weight: Grams): Cents {
  throw new Error("Not implemented");
}
