// IsNever checks the type as a whole, so never gives true and unions give false.
import { asList, type IsNever } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type Department = "dairy" | "bakery" | "frozen";

export type Cases = [
  Expect<Equal<IsNever<never>, true>>,
  Expect<Equal<IsNever<Exclude<Department, Department>>, true>>,
  Expect<Equal<IsNever<string>, false>>,
  Expect<Equal<IsNever<Department>, false>>,
  Expect<Equal<IsNever<undefined>, false>>,
  Expect<Equal<IsNever<null>, false>>,
  Expect<Equal<IsNever<unknown>, false>>,
  Expect<Equal<IsNever<string | never>, false>>,
  Expect<Equal<IsNever<[]>, false>>,
];

const yes: IsNever<never> = true;
check.true(yes, "IsNever<never> accepts the value true");
check.true(typeof asList === "function", "the module still exports asList");
