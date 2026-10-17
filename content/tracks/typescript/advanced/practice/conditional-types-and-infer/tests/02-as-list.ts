// AsList and asList: arrays stay as they are, anything else is wrapped; the type distributes.
import { asList, type AsList } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const frozenAisles: readonly string[] = ["dairy", "bakery"];
const aisles = asList(frozenAisles);
const quantity = asList(3);
const pair = asList(["apples", 6] as const);

export type Cases = [
  Expect<Equal<AsList<string>, string[]>>,
  Expect<Equal<AsList<number[]>, number[]>>,
  Expect<Equal<AsList<readonly string[]>, readonly string[]>>,
  Expect<Equal<AsList<string | number[]>, string[] | number[]>>,
  Expect<Equal<AsList<readonly ["apples", 6]>, readonly ["apples", 6]>>,
  Expect<Equal<AsList<{ name: string }>, { name: string }[]>>,
  Expect<Equal<typeof aisles, readonly string[]>>,
  Expect<Equal<typeof quantity, number[]>>,
  Expect<Equal<typeof pair, readonly ["apples", 6]>>,
];

check.equal(quantity, [3], "a number is wrapped in a one-item list");
check.true(aisles === frozenAisles, "a readonly list comes back as the same array");
check.equal(asList(""), [""], "an empty string is still one item");
check.equal(asList("bread"), ["bread"], "a string is one item, not a list of characters");
check.equal(asList(undefined), [undefined], "undefined is wrapped like any other value");
check.equal(asList(null), [null], "null is wrapped like any other value");
const empty: string[] = [];
check.true(asList(empty) === empty, "an empty list comes back as the same array");
const nested = [["a", "b"], ["c"]];
check.true(asList(nested) === nested, "a list of lists is returned as it is, not flattened");
const order = { name: "Weekly shop" };
const wrapped = asList(order);
check.true(wrapped.length === 1 && wrapped[0] === order, "an object is wrapped, not copied");
