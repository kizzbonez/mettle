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

// Step 1: run every rule that is not "off" over each line of the source.
export function lint(source: string, config: LintConfig): Report[] {
  throw new Error("Not implemented");
}

// Step 2: 1 when the check fails, as `eslint . --max-warnings N` would, otherwise 0.
export function exitCode(reports: readonly Report[], maxWarnings: number): 0 | 1 {
  throw new Error("Not implemented");
}
