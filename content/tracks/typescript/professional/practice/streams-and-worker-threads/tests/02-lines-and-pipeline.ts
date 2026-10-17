import { readFile, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { lines, summarizeRides } from "./solution.js";

async function collect(chunks: (string | Buffer)[]): Promise<string[]> {
  const result: string[] = [];
  for await (const line of lines(Readable.from(chunks))) result.push(line);
  return result;
}

// Chunks cut anywhere.
check.equal(await collect(["a\n\nb", "c\n"]), ["a", "", "bc"], "an empty line, and a line across two chunks");
check.equal(await collect(["one\ntwo\n"]), ["one", "two"], "a final newline gives no empty last line");
check.equal(await collect(["one\ntwo"]), ["one", "two"], "a last line without a newline is still a line");
check.equal(await collect(["Ana", ",4", "2,", "90", "\n"]), ["Ana,42,90"], "one line in five chunks");
check.equal(await collect(["x\n", "\n", "\n", "y"]), ["x", "", "", "y"], "chunks that are only newlines");
check.equal(await collect(["", "a", "", "\nb", ""]), ["a", "b"], "empty chunks");
check.equal(await collect([Buffer.from("Bo,30,"), Buffer.from("60\nCy,10,30\n")]), ["Bo,30,60", "Cy,10,30"], "Buffer chunks");
check.equal(await collect([]), [], "no chunks at all");
check.equal(await collect(["\n"]), [""], "a single newline is one empty line");

// A season of rides: large enough that the file arrives in many chunks.
const riders = ["Ana", "Bo", "Cy", "Dee", "Eli"];
let csv = "rider,km,minutes\n";
let expected = "";
for (let i = 0; i < 30_000; i++) {
  const rider = riders[i % riders.length];
  const km = 10 + (i % 90);
  const minutes = 30 + (i % 150);
  csv += `${rider},${km},${minutes}\n`;
  expected += `${rider} ${(km / (minutes / 60)).toFixed(1)} km/h\n`;
  if (i % 1000 === 0) csv += "\n"; // blank lines are skipped
}
csv += "Zed,12,0\nYan,abc,30\nXia,20,40";
expected += "Xia 30.0 km/h\n";
await writeFile("season-rides.csv", csv);
check.true(csv.length > 3 * 65_536, "the season's log is larger than three 64 KiB chunks");

await summarizeRides("season-rides.csv", "season-speeds.txt");
const written = await readFile("season-speeds.txt", "utf8");
check.equal(written.split("\n").length, expected.split("\n").length, "one summary for every valid ride, none for the others");
check.true(written === expected, "every summary of the season is correct, including rides cut between chunks");

// A missing file rejects instead of hanging or crashing.
await check.rejects(() => summarizeRides("no-such-rides.csv", "missing-speeds.txt"), "a missing input file rejects");
