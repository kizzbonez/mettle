// limitCalls: a higher-order function that keeps the wrapped function's exact parameters.
import { limitCalls } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const seen: string[] = [];
function charge(plate: string, cents: number): number {
  seen.push(`${plate}:${cents}`);
  return cents;
}

const limited = limitCalls(charge, 3);
const noArgs = limitCalls(() => true, 1);

export type Cases = [
  Expect<Equal<Parameters<typeof limited>, [plate: string, cents: number]>>,
  Expect<Equal<ReturnType<typeof limited>, number | undefined>>,
  Expect<Equal<Parameters<typeof noArgs>, []>>,
  Expect<Equal<ReturnType<typeof noArgs>, boolean | undefined>>,
];

check.equal(limited("AB-1", 200), 200, "the first call returns fn's result");
check.equal(limited("CD-2", 0), 0, "a falsy result is still returned");
check.equal(limited("EF-3", 350), 350, "the last allowed call returns fn's result");
check.equal(limited("GH-4", 500), undefined, "a call past the limit returns undefined");
check.equal(limited("IJ-5", 600), undefined, "later calls keep returning undefined");
check.equal(seen, ["AB-1:200", "CD-2:0", "EF-3:350"], "fn gets each allowed call's arguments and is not called past the limit");

let zeroCalls = 0;
const never = limitCalls(() => {
  zeroCalls += 1;
  return "called";
}, 0);
check.equal(never(), undefined, "a limit of 0 never calls fn");
check.equal(zeroCalls, 0, "fn was not called with a limit of 0");

const a = limitCalls(() => "a", 1);
const b = limitCalls(() => "b", 1);
a();
check.equal(b(), "b", "each limited function counts its own calls");
check.equal(noArgs(), true, "a function without parameters can be limited");
check.equal(noArgs(), undefined, "and stops after its limit");

export function misuse(): void {
  // @ts-expect-error the plate is a string
  limited(1, 200);
  // @ts-expect-error the amount is required
  limited("AB-1");
  // @ts-expect-error the result may be undefined
  const sure: number = limited("AB-1", 200);
  console.log(sure);
}
