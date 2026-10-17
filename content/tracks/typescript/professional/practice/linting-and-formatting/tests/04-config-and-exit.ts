import { exitCode, lint, type LintConfig, type Report } from "./solution.js";

const source = [
  "async function sync(): Promise<void> {}",      // 1
  "sync(); // @ts-ignore",                        // 2: all three rules
  "// eslint-disable",                            // 3
  "sync();",                                      // 4
].join("\n");

const allErrors: LintConfig = { "no-floating-promises": "error", "ban-ts-ignore": "error", "require-disable-reason": "error" };
check.equal(
  lint(source + " // eslint-disable-line", allErrors).map((report) => [report.line, report.rule]),
  [
    [2, "no-floating-promises"],
    [2, "ban-ts-ignore"],
    [3, "require-disable-reason"],
    [4, "no-floating-promises"],
    [4, "require-disable-reason"],
  ],
  "reports ordered by line, then by the order of RULES",
);

const mixed: LintConfig = { "no-floating-promises": "warn", "ban-ts-ignore": "off", "require-disable-reason": "error" };
check.equal(
  lint(source, mixed),
  [
    { line: 2, rule: "no-floating-promises", severity: "warn" },
    { line: 3, rule: "require-disable-reason", severity: "error" },
    { line: 4, rule: "no-floating-promises", severity: "warn" },
  ],
  "a rule that is off is not run, and each report has its rule's severity",
);

const allOff: LintConfig = { "no-floating-promises": "off", "ban-ts-ignore": "off", "require-disable-reason": "off" };
check.equal(lint(source, allOff), [], "every rule off");

// Exit codes.
function warn(line: number): Report {
  return { line, rule: "no-floating-promises", severity: "warn" };
}
const error: Report = { line: 9, rule: "ban-ts-ignore", severity: "error" };

check.equal(exitCode([], 0), 0, "no reports pass");
check.equal(exitCode([], -1), 0, "no reports pass without a limit");
check.equal(exitCode([error], 100), 1, "an error fails, whatever the warning limit");
check.equal(exitCode([error], -1), 1, "an error fails without a warning limit");
check.equal(exitCode([warn(1), warn(2), warn(3)], 3), 0, "as many warnings as allowed");
check.equal(exitCode([warn(1), warn(2), warn(3)], 2), 1, "one warning more than allowed");
check.equal(exitCode([warn(1), warn(2), warn(3)], -1), 0, "warnings without a limit");
check.equal(exitCode([warn(1)], 0), 1, "a single warning with --max-warnings 0");
check.equal(exitCode(lint(source, mixed), 5), 1, "the mixed configuration has an error");
