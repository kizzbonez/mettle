// saveSchedule replaces the file with a rename: the file is a new one, and no .tmp file is left.
import { existsSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import { saveSchedule } from "./solution.js";

await writeFile("t3-schedule.json", "the old schedule\n", "utf8");
const before = (await stat("t3-schedule.json")).ino;
await saveSchedule("t3-schedule.json", { "peace lily": 5, cactus: 21, fern: 3 });
check.equal(
  await readFile("t3-schedule.json", "utf8"),
  '{\n  "peace lily": 5,\n  "cactus": 21,\n  "fern": 3\n}\n',
  "the schedule as JSON indented by two spaces, with a final newline",
);
check.true((await stat("t3-schedule.json")).ino !== before, "the old file was replaced by renaming a new file over it, not rewritten in place");
check.true(!existsSync("t3-schedule.json.tmp"), "no .tmp file is left behind");

await saveSchedule("t3-schedule.json", { fern: 4 });
check.equal(await readFile("t3-schedule.json", "utf8"), '{\n  "fern": 4\n}\n', "a second save replaces the first");

await saveSchedule("t3-new.json", {});
check.equal(await readFile("t3-new.json", "utf8"), "{}\n", "saving creates a file that did not exist");
check.true(!existsSync("t3-new.json.tmp"), "no .tmp file is left behind for a new file either");
