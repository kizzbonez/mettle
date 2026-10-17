// Equal: true only for identical types, including where any and readonly are involved.
import { fare, type Equal } from "./solution.js";

type Same<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Cases = [
  Expect<Same<Equal<string, string>, true>>,
  Expect<Same<Equal<string, number>, false>>,
  Expect<Same<Equal<1 | 2, 2 | 1>, true>>,
  Expect<Same<Equal<never, never>, true>>,
  Expect<Same<Equal<ReturnType<typeof fare>, number>, true>>,
  Expect<Same<Equal<Parameters<typeof fare>, [km: number, night: boolean]>, true>>,
  Expect<Same<Equal<any, string>, false>>,
  Expect<Same<Equal<string, any>, false>>,
  Expect<Same<Equal<unknown, any>, false>>,
  Expect<Same<Equal<{ km: number }, { readonly km: number }>, false>>,
  Expect<Same<Equal<{ km?: number }, { km: number | undefined }>, false>>,
  Expect<Same<Equal<"day" | "night", string>, false>>,
];

check.true(typeof fare === "function", "the module still exports fare");
