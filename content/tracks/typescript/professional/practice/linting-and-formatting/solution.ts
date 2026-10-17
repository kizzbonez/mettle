// Homework Planner Lint
//
// Three small lint rules over source code given as text, and the exit code of a CI check
// run with --max-warnings.

export const RULES = ["no-floating-promises", "ban-ts-ignore", "require-disable-reason"] as const;

export type RuleName = (typeof RULES)[number];
export type Severity = "off" | "warn" | "error";
export type LintConfig = Readonly<Record<RuleName, Severity>>;

export interface Report {
  readonly line: number;
  readonly rule: RuleName;
  readonly severity: "warn" | "error";
}

/** The names of the functions the source declares with `async function name(`. */
function asyncFunctions(source: string): string[] {
  return Array.from(source.matchAll(/async\s+function\s+([A-Za-z0-9_$]+)\s*\(/g), (match) => match[1]);
}

function floats(line: string, asyncNames: readonly string[]): boolean {
  const statement = line.trim();
  if (statement.includes(".catch(")) return false;
  return asyncNames.some((name) => statement.startsWith(name + "("));
}

function disablesWithoutReason(line: string): boolean {
  const at = line.indexOf("eslint-disable");
  if (at === -1) return false;
  const rest = line.slice(at);
  const separator = rest.indexOf(" -- ");
  if (separator === -1) return true;
  return rest.slice(separator + 4).replace("*/", "").trim() === "";
}

export function lint(source: string, config: LintConfig): Report[] {
  const asyncNames = asyncFunctions(source); // a call may come before the declaration
  const checks: Record<RuleName, (line: string) => boolean> = {
    "no-floating-promises": (line) => floats(line, asyncNames),
    "ban-ts-ignore": (line) => line.includes("@ts-ignore"),
    "require-disable-reason": disablesWithoutReason,
  };

  const reports: Report[] = [];
  source.split("\n").forEach((text, index) => {
    for (const rule of RULES) {
      const severity = config[rule];
      if (severity !== "off" && checks[rule](text)) {
        reports.push({ line: index + 1, rule, severity });
      }
    }
  });
  return reports;
}

export function exitCode(reports: readonly Report[], maxWarnings: number): 0 | 1 {
  if (reports.some((report) => report.severity === "error")) return 1;
  const warnings = reports.filter((report) => report.severity === "warn").length;
  return maxWarnings >= 0 && warnings > maxWarnings ? 1 : 0;
}
