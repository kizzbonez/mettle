import { exitCode, lint } from "./solution.js";

// The example from the instructions.

const source = [
  "export async function saveHomework(id: string): Promise<void> {}",
  "function onSubmit(id: string): void {",
  "  saveHomework(id);",
  "  saveHomework(id).catch(console.error);",
  "  // @ts-ignore",
  "  // eslint-disable-next-line no-console",
  "  console.log(id); // eslint-disable-line no-console -- the planner's audit log",
  "}",
].join("\n");
const config = { "no-floating-promises": "error", "ban-ts-ignore": "error", "require-disable-reason": "warn" } as const;

check.equal(
  lint(source, config),
  [
    { line: 3, rule: "no-floating-promises", severity: "error" },
    { line: 5, rule: "ban-ts-ignore", severity: "error" },
    { line: 6, rule: "require-disable-reason", severity: "warn" },
  ],
  "the reports for the example source",
);
check.equal(exitCode(lint(source, config), -1), 1, "errors fail the check");

const warning = { line: 6, rule: "require-disable-reason", severity: "warn" } as const;
check.equal(exitCode([warning], 0), 1, "one warning with --max-warnings 0");
check.equal(exitCode([warning], 1), 0, "one warning with --max-warnings 1");
