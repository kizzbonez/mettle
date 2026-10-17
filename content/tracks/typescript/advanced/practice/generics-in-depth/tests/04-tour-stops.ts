// tourStops: a const type parameter keeps the literal tuple, and repeated stops are refused.
import { tourStops } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const tour = tourStops(["Harbour", "Old Mill", "Lighthouse"]);
const names: string[] = ["Dunes", "Pier"];
const fromVariable = tourStops(names);

export type Cases = [
  Expect<Equal<typeof tour, readonly ["Harbour", "Old Mill", "Lighthouse"]>>,
  Expect<Equal<typeof tour[0], "Harbour">>,
  Expect<Equal<typeof fromVariable, string[]>>,
];

export function misuse(): void {
  // @ts-expect-error the tour has only three stops
  console.log(tour[3]);
}

check.equal(tour, ["Harbour", "Old Mill", "Lighthouse"], "the stops come back in order");
check.equal(fromVariable, ["Dunes", "Pier"], "a list held in a variable works too");
check.equal(tourStops([]), [], "a tour without stops is allowed");
const error = check.throws(() => tourStops(["Dunes", "Pier", "Cove", "Pier", "Dunes"]), "a repeated stop is refused", Error);
check.equal(error.message, 'stop "Pier" appears twice', "the error names the first stop that is repeated");
check.throws(() => tourStops(["Cove", "Cove"]), "two equal stops in a row are refused", Error);
