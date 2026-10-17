// totalUsage: every bad line becomes a ReadingFailure with its cause, all in one AggregateError.
import { ReadingFailure, totalUsage } from "./solution.js";

const failure = new ReadingFailure("line 9: nothing was entered", { cause: { kind: "empty" } });
check.true(failure instanceof Error, "a ReadingFailure is an Error");
check.equal(failure.name, "ReadingFailure", "a ReadingFailure has its own name");
check.equal(failure.message, "line 9: nothing was entered", "a ReadingFailure keeps its message");
check.equal(failure.cause, { kind: "empty" }, "a ReadingFailure keeps its cause");
check.true(String(failure).startsWith("ReadingFailure: "), "the name shows when the error is printed");

check.equal(totalUsage([]), 0, "no lines total zero");
check.equal(totalUsage(["0", " 2.5 ", "7"]), 9.5, "good lines are added up after trimming");

const lines = ["3", "abc", "4", "", "-1", "6"];
const thrown = check.throws(() => totalUsage(lines), "bad lines make totalUsage throw an AggregateError", AggregateError);
check.equal(thrown.message, "3 reading(s) could not be read", "the message counts the bad readings");
const errors: unknown[] = (thrown as AggregateError).errors;
check.equal(errors.length, 3, "every bad line is reported, not only the first");
const failures = errors.filter((error): error is ReadingFailure => error instanceof ReadingFailure);
check.equal(failures.length, 3, "every reported error is a ReadingFailure");
check.equal(
  failures.map((error) => error.message),
  ['line 2: "abc" is not a number', "line 4: nothing was entered", "line 5: -1 is below zero"],
  "the failures are in line order, numbered from 1, with their explanations",
);
check.equal(
  failures.map((error) => error.cause),
  [{ kind: "not-a-number", text: "abc" }, { kind: "empty" }, { kind: "negative", value: -1 }],
  "each failure keeps the ReadingError as its cause",
);
check.true(failures.every((error) => error.name === "ReadingFailure"), "each failure carries the ReadingFailure name");

const single = check.throws(() => totalUsage(["oops"]), "one bad line is enough to throw", AggregateError);
check.equal(single.message, "1 reading(s) could not be read", "the count is right for a single bad line");
