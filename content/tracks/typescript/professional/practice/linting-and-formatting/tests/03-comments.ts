import { lint, type LintConfig, type Report } from "./solution.js";

const comments: LintConfig = { "no-floating-promises": "off", "ban-ts-ignore": "error", "require-disable-reason": "warn" };

function linesOf(reports: readonly Report[], rule: string): number[] {
  return reports.filter((report) => report.rule === rule).map((report) => report.line);
}

const source = [
  "// @ts-ignore",                                                               // 1
  "const grade = (raw as any).grade; // @ts-ignore",                             // 2
  "// @ts-expect-error the legacy API returns a number here",                    // 3
  "// eslint-disable-next-line no-console",                                      // 4
  "// eslint-disable-next-line no-console -- printing is this script's job",     // 5
  "console.log(x); // eslint-disable-line no-console",                           // 6
  "console.log(x); // eslint-disable-line no-console -- kept for the audit",     // 7
  "/* eslint-disable */",                                                        // 8
  "/* eslint-disable no-console -- a command-line tool */",                     // 9
  "/* eslint-disable no-console -- */",                                          // 10
  "// eslint-disable-next-line no-console --   ",                                // 11
  "// eslint-disable-next-line no-console --reason",                             // 12
  "// eslint-disable-next-line no-console -- fine -- really",                    // 13
  "// ESLint is disabled for nothing here",                                      // 14
  "const note = 'a -- b';",                                                      // 15
].join("\n");

const reports = lint(source, comments);
check.equal(linesOf(reports, "ban-ts-ignore"), [1, 2], "@ts-ignore on its own line and after code");
check.equal(linesOf(reports, "require-disable-reason"), [4, 6, 8, 10, 11, 12], "disable comments without a reason");
check.true(reports.every((report) => report.rule !== "ban-ts-ignore" || report.severity === "error"), "ban-ts-ignore reports carry its severity");
check.true(reports.every((report) => report.rule !== "require-disable-reason" || report.severity === "warn"), "require-disable-reason reports carry its severity");

// One line can break both rules: reports keep the order of RULES.
check.equal(
  lint("x(); // @ts-ignore eslint-disable-line", comments),
  [
    { line: 1, rule: "ban-ts-ignore", severity: "error" },
    { line: 1, rule: "require-disable-reason", severity: "warn" },
  ],
  "two rules on one line, in the order of RULES",
);
