// The example from the instructions, with this test's own file names.
import { readFileSync } from "node:fs";
import { intervalDays, readJournal, saveSchedule } from "./solution.js";

delete process.env.WATER_EVERY;
check.equal(await readJournal("t1-journal.txt"), [], "readJournal of a journal that does not exist yet");

const fern = runScript("", ["t1-journal.txt", "fern", "2026-10-17"]);
check.equal(fern.out, "fern watered, entry 1, next in 7 days\n", "node solution.js t1-journal.txt fern 2026-10-17");
check.equal(fern.code, 0, "the exit code after logging the fern");

process.env.WATER_EVERY = "3";
const pearls = runScript("", ["t1-journal.txt", "string of pearls", "2026-10-18"]);
delete process.env.WATER_EVERY;
check.equal(pearls.out, "string of pearls watered, entry 2, next in 3 days\n", "the second watering, with WATER_EVERY=3");

const usage = runScript("", ["t1-journal.txt", "fern"]);
check.true(usage.err.startsWith("usage:"), "two arguments print a usage line to standard error");
check.equal(usage.code, 2, "the exit code with two arguments");

check.equal(await readJournal("t1-journal.txt"), ["2026-10-17 fern", "2026-10-18 string of pearls"], "readJournal after two waterings");
await saveSchedule("t1-schedule.json", { fern: 7, cactus: 21 });
check.equal(readFileSync("t1-schedule.json", "utf8"), '{\n  "fern": 7,\n  "cactus": 21\n}\n', "the saved schedule");
check.throws(() => intervalDays({ WATER_EVERY: "0" }), 'intervalDays with WATER_EVERY "0" throws a RangeError', RangeError);
