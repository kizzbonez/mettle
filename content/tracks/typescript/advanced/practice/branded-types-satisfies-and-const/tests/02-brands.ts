// Grams and Cents: branded numbers that cannot be mixed, made only by checking functions.
import { quote, toGrams, type Cents, type Grams } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Cases = [
  Expect<Equal<Grams extends number ? true : false, true>>,
  Expect<Equal<Cents extends number ? true : false, true>>,
  Expect<Equal<number extends Grams ? true : false, false>>,
  Expect<Equal<Cents extends Grams ? true : false, false>>,
  Expect<Equal<Grams extends Cents ? true : false, false>>,
  Expect<Equal<ReturnType<typeof toGrams>, Grams>>,
  Expect<Equal<ReturnType<typeof quote>, Cents>>,
];

const weight = toGrams(2500);
const asNumber: number = weight;
check.equal(asNumber, 2500, "a checked weight is the same number at run time");
check.equal(weight.toFixed(0), "2500", "number methods work on a checked weight");
check.equal(toGrams(1), 1, "one gram is the lightest weight accepted");
check.equal(toGrams(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER, "the largest safe integer is accepted");

const refused: [number, string][] = [
  [0, "zero grams"],
  [-250, "a negative weight"],
  [99.9, "a fraction of a gram"],
  [Number.NaN, "NaN"],
  [Number.POSITIVE_INFINITY, "an infinite weight"],
  [2 ** 53, "a number beyond the safe integers"],
];
for (const [amount, what] of refused) {
  check.throws(() => toGrams(amount), `toGrams refuses ${what} with a RangeError`, RangeError);
}

export function misuse(price: Cents, grams: Grams): void {
  // @ts-expect-error a weight is not a price
  const wrongPrice: Cents = grams;
  // @ts-expect-error a price is not a weight
  const wrongWeight: Grams = price;
  // @ts-expect-error a plain number has not been checked
  const unchecked: Grams = 500;
  console.log(wrongPrice, wrongWeight, unchecked);
}
