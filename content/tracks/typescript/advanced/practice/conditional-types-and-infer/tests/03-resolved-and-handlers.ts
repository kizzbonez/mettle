// Resolved unwraps promises recursively; HandlerResult accepts only function types.
import { asList, type HandlerResult, type Resolved } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface Slot {
  day: string;
  hour: number;
}

function basketTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0);
}
async function deliverySlots(postcode: string): Promise<Slot[]> {
  return [{ day: postcode.startsWith("N") ? "Mon" : "Tue", hour: 9 }];
}
type SlowSlots = (postcode: string) => Promise<Promise<Slot[]>>;
function cancel(orderId: string, reason?: string): void {
  console.log(orderId, reason);
}

export type Cases = [
  Expect<Equal<Resolved<number>, number>>,
  Expect<Equal<Resolved<Promise<number>>, number>>,
  Expect<Equal<Resolved<Promise<Promise<Promise<boolean>>>>, boolean>>,
  Expect<Equal<Resolved<string | Promise<number>>, string | number>>,
  Expect<Equal<Resolved<Promise<string[]>[]>, Promise<string[]>[]>>,
  Expect<Equal<HandlerResult<typeof basketTotal>, number>>,
  Expect<Equal<HandlerResult<typeof deliverySlots>, Slot[]>>,
  Expect<Equal<HandlerResult<SlowSlots>, Slot[]>>,
  Expect<Equal<HandlerResult<typeof cancel>, void>>,
  Expect<Equal<HandlerResult<() => Promise<undefined>>, undefined>>,
];

export type NotAHandler =
  // @ts-expect-error a string is not a handler function
  HandlerResult<string>;

export type NotAHandlerEither =
  // @ts-expect-error a promise is not a handler function either
  HandlerResult<Promise<number>>;

check.equal(basketTotal([120, 80]), 200, "the example handlers run");
check.equal(await deliverySlots("N1"), [{ day: "Mon", hour: 9 }], "the example async handler runs");
check.true(typeof asList === "function", "the module still exports asList");
