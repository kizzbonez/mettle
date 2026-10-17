import { parseReading, type Reading } from "./solution.js";

check.equal(parseReading("07:30,3.5"), { time: "07:30", celsius: 3.5 }, "a plain reading");
check.equal(parseReading(" 23:45 , -1.5 "), { time: "23:45", celsius: -1.5 }, "spaces around the fields and a temperature below 0");
check.equal(parseReading("06:00,0"), { time: "06:00", celsius: 0 }, "a temperature of exactly 0");

check.equal(parseReading("07:30"), 'expected "time,celsius" but found 1 field(s)', "a line with one field");
check.equal(parseReading("07:30,3,4"), 'expected "time,celsius" but found 3 field(s)', "a line with three fields");
check.equal(parseReading("7:30,3"), '"7:30" is not a time like 07:30', "a time one character short");
check.equal(parseReading("07.30,3"), '"07.30" is not a time like 07:30', "a time with a dot instead of a colon");
check.equal(parseReading(",3"), '"" is not a time like 07:30', "an empty time");
check.equal(parseReading("07:30, "), '"" is not a temperature', "an empty temperature");
check.equal(parseReading("07:30,cold"), '"cold" is not a temperature', "a temperature in words");
check.equal(parseReading("07:30,3C"), '"3C" is not a temperature', "a temperature with a unit after it");

// These lines are type-checked but never run.
function typeChecks(): void {
  const result: Reading | string = parseReading("07:30,3");
  // @ts-expect-error the result may be a message, not a reading
  const reading: Reading = parseReading("07:30,3");
  console.log(result, reading);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
