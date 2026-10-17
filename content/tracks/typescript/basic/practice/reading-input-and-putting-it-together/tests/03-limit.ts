import { parseLimit, tooWarm } from "./solution.js";

check.equal(parseLimit(undefined), 5, "the limit when no argument is given");
check.equal(parseLimit("8"), 8, "a whole-number limit");
check.equal(parseLimit("4.5"), 4.5, "a limit with a fraction");
check.equal(parseLimit("-18"), -18, "a limit below 0, for a freezer");
check.equal(parseLimit(""), undefined, "an empty argument");
check.equal(parseLimit("cold"), undefined, "an argument that is not a number");

const day = [
  { time: "08:00", celsius: 4 },
  { time: "12:00", celsius: 4.1 },
  { time: "16:00", celsius: 3 },
  { time: "20:00", celsius: 9 },
];
check.equal(tooWarm(day, 4), [{ time: "12:00", celsius: 4.1 }, { time: "20:00", celsius: 9 }], "readings above the limit, in their order");
check.equal(tooWarm(day, 9), [], "a reading equal to the limit is not too warm");
check.equal(tooWarm([], 5), [], "no readings at all");

const log = "08:00,4\n12:00,6.5\n20:00,9\n";
const strict = runScript(log, ["6"]);
check.equal(strict.out, "3 readings, 2 above 6 C\ntoo warm at 12:00: 6.5 C\ntoo warm at 20:00: 9 C\n", "the report with the argument 6");
check.equal(strict.code, 0, "the exit code when no line was rejected");

const wrong = runScript(log, ["cold"]);
check.equal(wrong.out, "", "nothing on standard output when the argument is not a number");
check.equal(wrong.err, 'the limit must be a number, got "cold"\n', "the message on standard error when the argument is not a number");
check.equal(wrong.code, 2, "the exit code when the argument is not a number");
