import { SeatError } from "./solution.js";

const error = new SeatError("seat code missing its dash", "F9");
check.equal(error.message, "seat code missing its dash", "the message given to the constructor");
check.equal(error.code, "F9", "the code given to the constructor");
check.equal(error.name, "SeatError", "the name of a SeatError");
check.true(error instanceof Error, "a SeatError is also an Error");

// These lines are type-checked but never run.
function typeChecks(): void {
  const asError: Error = new SeatError("bad code", "Q1");
  const code: string = new SeatError("bad code", "Q1").code;
  // @ts-expect-error a SeatError needs the seat code as well as the message
  const withoutCode = new SeatError("only a message");
  console.log(asError, code, withoutCode);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
