// SERVICES: checked with satisfies, kept literal and readonly with as const.
import { SERVICES, type ServiceInfo, type ServiceName } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Cases = [
  Expect<Equal<ServiceName, "economy" | "standard" | "express">>,
  Expect<Equal<typeof SERVICES.express.days, 1>>,
  Expect<Equal<typeof SERVICES.economy.centsPerKg, 250>>,
  Expect<Equal<typeof SERVICES.standard, { readonly centsPerKg: 400; readonly days: 3 }>>,
];

const asRecord: Record<string, ServiceInfo> = SERVICES;
check.equal(
  asRecord,
  {
    economy: { centsPerKg: 250, days: 5 },
    standard: { centsPerKg: 400, days: 3 },
    express: { centsPerKg: 950, days: 1 },
  },
  "SERVICES holds the three services with their prices and days",
);

export function misuse(): void {
  // @ts-expect-error SERVICES is readonly all the way down
  SERVICES.express.days = 2;
  // @ts-expect-error there is no overnight service
  console.log(SERVICES.overnight);
  // @ts-expect-error the express service takes one day
  const twoDays: 2 = SERVICES.express.days;
  console.log(twoDays);
}
