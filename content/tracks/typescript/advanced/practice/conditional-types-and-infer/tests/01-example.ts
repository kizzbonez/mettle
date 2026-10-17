// The example from the instructions.
import { asList, type HandlerResult, type IsNever, type Resolved } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

async function findProduct(code: string): Promise<{ code: string; name: string } | undefined> {
  return code === "p-1" ? { code, name: "Oat milk" } : undefined;
}

const single = asList("milk");
const basket = ["eggs", "milk"];
const same = asList(basket);

export type Cases = [
  Expect<Equal<typeof single, string[]>>,
  Expect<Equal<typeof same, string[]>>,
  Expect<Equal<HandlerResult<typeof findProduct>, { code: string; name: string } | undefined>>,
  Expect<Equal<Resolved<Promise<Promise<string[]>>>, string[]>>,
  Expect<Equal<IsNever<never>, true>>,
  Expect<Equal<IsNever<string | number>, false>>,
];

check.equal(single, ["milk"], "asList wraps a single item in a list");
check.true(same === basket, "asList returns a list it is given as it is, not a copy");
check.equal(await findProduct("p-1"), { code: "p-1", name: "Oat milk" }, "the example handler finds its product");
