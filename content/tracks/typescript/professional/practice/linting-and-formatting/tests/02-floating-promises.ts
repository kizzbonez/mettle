import { lint, type LintConfig } from "./solution.js";

const only: LintConfig = { "no-floating-promises": "error", "ban-ts-ignore": "off", "require-disable-reason": "off" };

function floatingLines(lines: string[]): number[] {
  return lint(lines.join("\n"), only).map((report) => report.line);
}

const declarations = [
  "async function loadTimetable(week: number): Promise<string[]> { return []; }",
  "export async function   notifyParents (id: string) {}",
  "function formatDue(day: string): string { return day; }",
  "const $later = 1;",
  "async function $sync_2(): Promise<void> {}",
];

check.equal(
  floatingLines([
    ...declarations,
    "loadTimetable(3);",                        // 6: floats
    "  notifyParents(student.id);",            // 7: floats, indented
    "notifyParents(id).then(() => done());",    // 8: floats, then without catch
    "$sync_2();",                               // 9: floats
    "formatDue(\"Monday\");",                   // 10: not async
    "await loadTimetable(3);",                  // 11
    "void notifyParents(id);",                  // 12
    "return loadTimetable(4);",                 // 13
    "const week = loadTimetable(5);",           // 14
    "notifyParents(id).catch(report);",         // 15
    "loadTimetable(6).then(show).catch(log);",  // 16
  ]),
  [6, 7, 8, 9],
  "calls of async functions that start a line and are not handled",
);

check.equal(
  floatingLines([
    "uploadEssay(file);",                        // 1: called before it is declared
    "uploadEssayDraft(file);",                   // 2: a different function
    "upload(file);",                             // 3: a different function
    "  // uploadEssay(file);",                   // 4: a comment does not start with the call
    "async function uploadEssay(file: string) {}",
    "function upload(file: string) {}",
    "async function uploadEssayDraft(file: string) {}",
  ]),
  [1, 2],
  "a call above the declaration, and names that only share a beginning",
);

check.equal(floatingLines(["saveHomework(id);", "function saveHomework(id: string) {}"]), [], "a function that is not async never floats");
check.equal(floatingLines(["async () => {};", "fetchGrades(1);"]), [], "an async arrow function declares no name");
check.equal(floatingLines([""]), [], "an empty source");
