// Patch: every property optional and writable, each with its original type.
import { makeSetters, type CupSize, type Patch } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface Order {
  readonly id: number;
  drink: string;
  size: CupSize;
  readonly paid: boolean;
  note?: string;
  extras: readonly string[];
}

export type Cases = [
  Expect<
    Equal<
      Patch<Order>,
      { id?: number; drink?: string; size?: CupSize; paid?: boolean; note?: string; extras?: readonly string[] }
    >
  >,
  Expect<Equal<Patch<{ shots: number }>, { shots?: number }>>,
  Expect<Equal<Patch<{ readonly a: 1; b?: 2 }>, { a?: 1; b?: 2 }>>,
  Expect<Equal<Patch<{}>, {}>>,
];

const empty: Patch<Order> = {};
empty.paid = true;
empty.size = "medium";
check.equal(empty, { paid: true, size: "medium" }, "a patch starts empty and takes any field");

export function misuse(edit: Patch<Order>): void {
  // @ts-expect-error a patch keeps the types of the fields
  edit.size = "huge";
  // @ts-expect-error a patch has no fields the order does not have
  const unknownField: Patch<Order> = { milk: "oat" };
  console.log(unknownField);
}

check.true(typeof makeSetters === "function", "the module still exports makeSetters");
