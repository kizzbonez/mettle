// TicketParts: a template literal pattern with infer reads the size and the drink.
import { makeSetters, type TicketParts } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Cases = [
  Expect<Equal<TicketParts<"small-latte">, { size: "small"; drink: "latte" }>>,
  Expect<Equal<TicketParts<"medium-flat white">, { size: "medium"; drink: "flat white" }>>,
  Expect<Equal<TicketParts<"large-iced-mocha">, { size: "large"; drink: "iced-mocha" }>>,
  Expect<Equal<TicketParts<"large-">, { size: "large"; drink: "" }>>,
  Expect<Equal<TicketParts<"huge-latte">, never>>,
  Expect<Equal<TicketParts<"Large-latte">, never>>,
  Expect<Equal<TicketParts<"latte">, never>>,
  Expect<Equal<TicketParts<"">, never>>,
  Expect<
    Equal<TicketParts<"small-tea" | "large-cocoa">, { size: "small"; drink: "tea" } | { size: "large"; drink: "cocoa" }>
  >,
];

const ticket: TicketParts<"small-chai"> = { size: "small", drink: "chai" };
check.equal(ticket.drink, "chai", "a value of a TicketParts type can be written");

export function misuse(): void {
  // @ts-expect-error the drink on this ticket is a latte
  const wrongDrink: TicketParts<"small-latte"> = { size: "small", drink: "mocha" };
  console.log(wrongDrink);
}

check.true(typeof makeSetters === "function", "the module still exports makeSetters");
