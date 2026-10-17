// The example from the instructions.
import { explain, parseReading, ReadingFailure, totalUsage } from "./solution.js";

check.equal(parseReading(" 42.5 "), { ok: true, value: 42.5 }, "a reading with spaces around it is a success");
check.equal(parseReading("12kg"), { ok: false, error: { kind: "not-a-number", text: "12kg" } }, "text with letters is not a number");
check.equal(explain({ kind: "negative", value: -3 }), "-3 is below zero", "explain describes a negative reading");
check.equal(totalUsage(["10", "4.5"]), 14.5, "totalUsage adds up good readings");

const thrown = check.throws(() => totalUsage(["10", "", "-2"]), "totalUsage throws when lines are bad", AggregateError);
check.equal(thrown.message, "2 reading(s) could not be read", "the AggregateError says how many readings failed");
const failures = (thrown as AggregateError).errors;
check.true(failures.every((failure) => failure instanceof ReadingFailure), "every error in the list is a ReadingFailure");
check.equal(
  failures.map((failure: Error) => failure.message),
  ["line 2: nothing was entered", "line 3: -2 is below zero"],
  "each failure names its line and explains it",
);

export function misuse(): void {
  // @ts-expect-error check ok before reading the value
  console.log(parseReading("5").value);
}
