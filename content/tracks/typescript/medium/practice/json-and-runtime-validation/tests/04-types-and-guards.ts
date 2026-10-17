// Parsed<T> is a discriminated union, and isStringArray narrows unknown values.
import { isStringArray, parseDonation, type Parsed } from "./solution.js";

const yes: unknown[] = [[], ["nuts"], ["nuts", "milk", ""]];
const no: unknown[] = [["nuts", 3], [null], "nuts", null, undefined, 7, { 0: "nuts", length: 1 }];
for (const value of yes) {
  check.true(isStringArray(value), `isStringArray accepts ${JSON.stringify(value)}`);
}
for (const value of no) {
  check.true(!isStringArray(value), `isStringArray refuses ${JSON.stringify(value) ?? "undefined"}`);
}

const raw: unknown = JSON.parse('["gluten", "egg"]');
const joined = isStringArray(raw) ? raw.join(" and ") : "";
check.equal(joined, "gluten and egg", "after isStringArray, the value can be used as a string[]");

const ok: Parsed<number> = { ok: true, value: 3 };
const failed: Parsed<number> = { ok: false, errors: ["too cold"] };
function describe(result: Parsed<number>): string {
  return result.ok ? `value ${result.value}` : result.errors.join(", ");
}
check.equal([describe(ok), describe(failed)], ["value 3", "too cold"], "a Parsed<number> narrows on ok");

function typeChecksOnly(): void {
  const result = parseDonation("{}");
  // @ts-expect-error the value can only be read after checking ok
  result.value;
  // @ts-expect-error a successful result needs a value
  const noValue: Parsed<number> = { ok: true, errors: [] };
  // @ts-expect-error a failed result lists its errors
  const noErrors: Parsed<number> = { ok: false };
  // @ts-expect-error the value of a Parsed<number> is a number
  const textValue: Parsed<number> = { ok: true, value: "3" };
}
check.true(typeof typeChecksOnly === "function", "Parsed<T> is a discriminated union on ok");
