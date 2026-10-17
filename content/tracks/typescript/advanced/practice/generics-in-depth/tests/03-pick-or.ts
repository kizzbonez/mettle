// pickOr: the choices alone decide the type, so a fallback that is not a choice is rejected.
import { pickOr } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const size = pickOr(["S", "M"], "S", "M");
const helmet = pickOr(["kids", "adult"], undefined, "adult");

export type Cases = [Expect<Equal<typeof size, "S" | "M">>, Expect<Equal<typeof helmet, "kids" | "adult">>];

export function misuse(): void {
  // @ts-expect-error the fallback must be one of the choices
  pickOr(["S", "M"], "S", "XL");
}

check.equal(size, "S", "a request that is a choice is returned");
check.equal(helmet, "adult", "an undefined request gives the fallback");
check.equal(pickOr(["S", "M", "L"], "m", "L"), "L", "requests are compared exactly, so a lower-case size is not a choice");
check.equal(pickOr(["S", "M", "L"], "", "S"), "S", "an empty request gives the fallback");
check.equal(pickOr(["S", "M", "L"], "S", "L"), "S", "the first choice can be requested");
check.equal(pickOr(["S", "M", "L"], "L", "S"), "L", "the last choice can be requested");
