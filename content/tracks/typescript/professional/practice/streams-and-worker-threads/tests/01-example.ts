import { readFile, writeFile } from "node:fs/promises";
import { Readable, Writable } from "node:stream";
import { climbInWorker, lines, summarizeRides, writeAll } from "./solution.js";

// The example from the instructions.

const seen: string[] = [];
for await (const line of lines(Readable.from(["Ana,42,9", "0\nBo,30,60\n", "Cy,10,30"]))) seen.push(line);
check.equal(seen, ["Ana,42,90", "Bo,30,60", "Cy,10,30"], "lines joins a line cut between two chunks");

await writeFile("example-rides.csv", "rider,km,minutes\nAna,42,90\nBo,30,60\n");
await summarizeRides("example-rides.csv", "example-speeds.txt");
check.equal(await readFile("example-speeds.txt", "utf8"), "Ana 28.0 km/h\nBo 30.0 km/h\n", "summarizeRides writes one summary per ride");

const sink = new Writable({
  objectMode: true,
  highWaterMark: 3,
  write(_item, _encoding, done) {
    setImmediate(done);
  },
});
check.equal(await writeAll(sink, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 3, "writeAll waits for drain three times");

const result = await climbInWorker([120, 180, 150, 210]);
check.equal(result.climb, 120, "the climb computed in the worker");
check.true(result.threadId !== 0, "the climb was computed in a worker thread, not on the main thread");
