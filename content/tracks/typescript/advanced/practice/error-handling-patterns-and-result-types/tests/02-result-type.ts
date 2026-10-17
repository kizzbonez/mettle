// Result: a discriminated union in which a value and an error can never be mixed up.
import { parseReading, type ReadingError, type Result } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Cases = [
  Expect<Equal<Result<number, string>, { ok: true; value: number } | { ok: false; error: string }>>,
  Expect<Equal<ReturnType<typeof parseReading>, Result<number, ReadingError>>>,
];

function describe(result: Result<number, ReadingError>): string {
  if (result.ok) {
    const value: number = result.value;
    return `read ${value}`;
  }
  const error: ReadingError = result.error;
  return `failed: ${error.kind}`;
}

check.equal(describe(parseReading("7")), "read 7", "after checking ok, the value is a number");
check.equal(describe(parseReading("")), "failed: empty", "after checking ok is false, the error is a ReadingError");

export function misuse(result: Result<number, ReadingError>): void {
  // @ts-expect-error the value is only there after checking ok
  console.log(result.value);
  // @ts-expect-error the error is only there after checking ok
  console.log(result.error);
  if (result.ok) {
    // @ts-expect-error a success has no error
    console.log(result.error);
  }
  // @ts-expect-error a success cannot carry an error as well
  const both: Result<number, string> = { ok: true, value: 1, error: "and yet" };
  // @ts-expect-error a failure needs its error
  const empty: Result<number, string> = { ok: false };
  // @ts-expect-error a success needs its value
  const hollow: Result<number, string> = { ok: true };
  console.log(both, empty, hollow);
}
