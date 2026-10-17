// The import line, read from solution.ts: names from "node:path", ParsedPath marked as a type.
// And archivePath lets join tidy the folder.
import { readFileSync } from "node:fs";
import { archivePath } from "./solution.js";

const source = readFileSync("solution.ts", "utf8");
const lines = [...source.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s*from\s*["']node:path["']/g)];
check.true(lines.length > 0, 'solution.ts imports names in braces from "node:path", with the node: prefix');

const names = lines.flatMap((line) =>
  line[2]
    .split(",")
    .map((name) => name.trim().replace(/\s+/g, " "))
    .filter((name) => name !== "")
    .map((name) => (line[1] ? `type ${name}` : name)),
);
check.true(names.includes("join") && names.includes("parse"), "join and parse are imported by name from node:path");
check.true(names.includes("type ParsedPath"), "ParsedPath is imported from node:path with the type marker");

const beach = { year: 1987, month: 6, label: "beach", index: 1 };
check.equal(archivePath("scans/", beach), "scans/1987/1987-06-beach-01.jpg", "a folder ending in a slash");
check.equal(archivePath("albums/../scans", beach), "scans/1987/1987-06-beach-01.jpg", "a folder with .. in it is tidied");
check.equal(
  archivePath("/home/ana/photos", beach),
  "/home/ana/photos/1987/1987-06-beach-01.jpg",
  "an absolute folder stays absolute",
);
