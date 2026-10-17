/** A symbol that exists only for the compiler, used to brand types. */
declare const brand: unique symbol;

export type Grams = number & { readonly [brand]: "Grams" };
export type Cents = number & { readonly [brand]: "Cents" };

/** A whole, safe number of grams, at least 1; anything else throws a RangeError. */
export function toGrams(amount: number): Grams {
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new RangeError(`not a weight in grams: ${amount}`);
  }
  return amount as Grams;
}

/** What a service costs and how long it takes. */
export interface ServiceInfo {
  readonly centsPerKg: number;
  readonly days: number;
}

export const SERVICES = {
  economy: { centsPerKg: 250, days: 5 },
  standard: { centsPerKg: 400, days: 3 },
  express: { centsPerKg: 950, days: 1 },
} as const satisfies Record<string, ServiceInfo>;

/** The names of the services, derived from SERVICES. */
export type ServiceName = keyof typeof SERVICES;

/** The price in cents, charging every started kilogram in full. */
export function quote(service: ServiceName, weight: Grams): Cents {
  const kilograms = Math.ceil(weight / 1000);
  return (kilograms * SERVICES[service].centsPerKg) as Cents;
}
