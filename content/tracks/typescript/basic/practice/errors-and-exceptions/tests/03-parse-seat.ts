import { parseSeat, SeatError } from "./solution.js";

check.equal(parseSeat("A-1"), { row: "A", number: 1 }, "the first seat of the first row");
check.equal(parseSeat("J-20"), { row: "J", number: 20 }, "the last seat of the last row");
check.equal(parseSeat("  h-07\t"), { row: "H", number: 7 }, "a code with spaces, a lower-case row and a leading zero");

const notCodes = ["C", "C-", "-12", "CC-12", "C-12-1", "C-twelve", "C-1.5", ""];
for (const code of notCodes) {
  const thrown = check.throws(() => parseSeat(code), `parseSeat(${JSON.stringify(code)}) throws a SeatError`, SeatError);
  check.equal(thrown.message, `"${code}" is not a seat code`, `the message of the SeatError for ${JSON.stringify(code)}`);
  check.true(thrown instanceof SeatError && thrown.code === code, `the code kept by the SeatError for ${JSON.stringify(code)}`);
}

const outside = [
  { code: "K-5", message: "there is no seat K-5" },
  { code: "a-0", message: "there is no seat A-0" },
  { code: "B-21", message: "there is no seat B-21" },
];
for (const { code, message } of outside) {
  const thrown = check.throws(() => parseSeat(code), `parseSeat("${code}") throws a RangeError`, RangeError);
  check.equal(thrown.message, message, `the message of the RangeError for "${code}"`);
  check.true(!(thrown instanceof SeatError), `a seat outside the cinema, "${code}", is not a SeatError`);
}
