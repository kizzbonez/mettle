// GREENHOUSE_UNITS: typed by a global augmentation, and still checked by units() at run time.
import { units } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Cases = [
  Expect<Equal<typeof process.env.GREENHOUSE_UNITS, "metric" | "imperial" | undefined>>,
  Expect<Equal<typeof process.env.SOME_OTHER_VARIABLE, string | undefined>>,
];

delete process.env.GREENHOUSE_UNITS;
check.equal(units(), "metric", "units default to metric when the variable is not set");
process.env.GREENHOUSE_UNITS = "imperial";
check.equal(units(), "imperial", "units follow the variable when it is imperial");
process.env.GREENHOUSE_UNITS = "metric";
check.equal(units(), "metric", "units follow the variable when it is metric");

Object.assign(process.env, { GREENHOUSE_UNITS: "kelvin" });
const wrong = check.throws(() => units(), "units refuses a value that is neither metric nor imperial", Error);
check.true(wrong.message.includes("kelvin"), "the error message includes the value that was refused");
Object.assign(process.env, { GREENHOUSE_UNITS: "Imperial" });
check.throws(() => units(), "units compares the value exactly, so Imperial is refused", Error);
Object.assign(process.env, { GREENHOUSE_UNITS: "" });
check.throws(() => units(), "units refuses an empty value", Error);
delete process.env.GREENHOUSE_UNITS;

export function misuse(): void {
  // @ts-expect-error the variable is metric or imperial, so "us" can never match
  if (process.env.GREENHOUSE_UNITS === "us") console.log("never");
  // @ts-expect-error only metric or imperial may be assigned
  process.env.GREENHOUSE_UNITS = "kelvin";
}
