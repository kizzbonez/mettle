// intervalDays reads the environment strictly; the program checks its arguments and the
// environment, sets exit codes, and creates the journal's folders.
import { existsSync } from "node:fs";
import { intervalDays, readJournal } from "./solution.js";

check.equal(intervalDays({}), 7, "7 days when WATER_EVERY is missing");
check.equal(intervalDays({ WATER_EVERY: "3" }), 3, "WATER_EVERY of 3");
check.equal(intervalDays({ WATER_EVERY: "1" }), 1, "1 day is the shortest interval");
check.equal(intervalDays({ WATER_EVERY: "60" }), 60, "60 days is the longest interval");
for (const bad of ["0", "61", "2.5", "seven", "", "-3"]) {
  check.throws(() => intervalDays({ WATER_EVERY: bad }), `WATER_EVERY "${bad}" is refused with a RangeError`, RangeError);
}

delete process.env.WATER_EVERY;
const nested = runScript("", ["t4-logs/october/journal.txt", "aloe", "2026-10-20"]);
check.equal(nested.out, "aloe watered, entry 1, next in 7 days\n", "the program creates the journal's folders");
check.equal(await readJournal("t4-logs/october/journal.txt"), ["2026-10-20 aloe"], "the journal line is the date and the plant");
const again = runScript("", ["t4-logs/october/journal.txt", "aloe", "2026-10-27"]);
check.equal(again.out, "aloe watered, entry 2, next in 7 days\n", "a second watering is appended");

for (const args of [[], ["t4-x.txt"], ["t4-x.txt", "fern", "2026-10-20", "extra"]]) {
  const ran = runScript("", args);
  check.equal([ran.code, ran.out], [2, ""], `${args.length} arguments give exit code 2 and no output`);
  check.true(ran.err.startsWith("usage:"), `${args.length} arguments print a usage line to standard error`);
}
check.true(!existsSync("t4-x.txt"), "nothing is written when the arguments are wrong");

process.env.WATER_EVERY = "often";
const badEnv = runScript("", ["t4-bad.txt", "fern", "2026-10-21"]);
delete process.env.WATER_EVERY;
check.equal([badEnv.code, badEnv.out], [2, ""], "a wrong WATER_EVERY gives exit code 2 and no output");
check.true(badEnv.err.trim() !== "", "a wrong WATER_EVERY prints the error's message to standard error");
check.true(!existsSync("t4-bad.txt"), "nothing is written when WATER_EVERY is wrong");
