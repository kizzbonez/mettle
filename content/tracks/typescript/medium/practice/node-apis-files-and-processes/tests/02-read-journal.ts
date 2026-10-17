// readJournal skips blank lines, treats only a missing file as empty, and rethrows other errors.
import { mkdir, writeFile } from "node:fs/promises";
import { readJournal } from "./solution.js";

await writeFile("t2-journal.txt", "2026-10-01 fern\n\n   \n2026-10-03 monstera\n2026-10-05 peace lily", "utf8");
check.equal(
  await readJournal("t2-journal.txt"),
  ["2026-10-01 fern", "2026-10-03 monstera", "2026-10-05 peace lily"],
  "blank lines are left out, and a last line without a newline is kept",
);

await writeFile("t2-empty.txt", "", "utf8");
check.equal(await readJournal("t2-empty.txt"), [], "an empty file has no entries");

await writeFile("t2-accents.txt", Buffer.from("2026-10-09 Calathea à rayures\n", "utf8"));
check.equal(await readJournal("t2-accents.txt"), ["2026-10-09 Calathea à rayures"], "the journal is read as UTF-8 text");

check.equal(await readJournal("t2-missing.txt"), [], "a missing file is an empty journal");
check.equal(await readJournal("t2-no-folder/journal.txt"), [], "a file in a missing folder is an empty journal too");

await mkdir("t2-folder", { recursive: true });
const error = await check.rejects(() => readJournal("t2-folder"), "reading a folder rejects instead of returning an empty journal");
check.equal((error as NodeJS.ErrnoException).code, "EISDIR", "the folder's own EISDIR error is rethrown");
