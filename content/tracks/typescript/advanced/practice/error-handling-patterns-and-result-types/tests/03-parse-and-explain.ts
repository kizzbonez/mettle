// parseReading returns every failure as a value; explain describes each kind.
import { explain, parseReading, type ReadingError } from "./solution.js";

check.equal(parseReading("0"), { ok: true, value: 0 }, "zero is a valid reading");
check.equal(parseReading("1234"), { ok: true, value: 1234 }, "a whole number is a valid reading");
check.equal(parseReading("\t 8.25\n"), { ok: true, value: 8.25 }, "tabs and newlines around a reading are trimmed");
check.equal(parseReading(""), { ok: false, error: { kind: "empty" } }, "an empty box is the empty kind");
check.equal(parseReading("   "), { ok: false, error: { kind: "empty" } }, "a box with only spaces is the empty kind");
check.equal(parseReading("  abc "), { ok: false, error: { kind: "not-a-number", text: "abc" } }, "the not-a-number error keeps the trimmed text");
check.equal(parseReading("Infinity"), { ok: false, error: { kind: "not-a-number", text: "Infinity" } }, "an infinite number is not a reading");
check.equal(parseReading("4,5"), { ok: false, error: { kind: "not-a-number", text: "4,5" } }, "a comma is not a decimal point here");
check.equal(parseReading("-3"), { ok: false, error: { kind: "negative", value: -3 } }, "a number below zero is the negative kind, with the number");
check.equal(parseReading(" -0.5 "), { ok: false, error: { kind: "negative", value: -0.5 } }, "a small negative number is the negative kind too");

const errors: ReadingError[] = [
  { kind: "empty" },
  { kind: "not-a-number", text: "12kg" },
  { kind: "not-a-number", text: "" },
  { kind: "negative", value: -3 },
  { kind: "negative", value: -0.25 },
];
check.equal(
  errors.map(explain),
  ["nothing was entered", '"12kg" is not a number', '"" is not a number', "-3 is below zero", "-0.25 is below zero"],
  "explain gives the sentence for each kind of failure",
);
