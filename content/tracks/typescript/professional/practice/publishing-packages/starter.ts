// Yarn Package Check
//
// Reads the text of a package.json: which file its exports map serves for an import,
// and which mistakes in exports and files would break consumers.
import { posix } from "node:path";

export type Rule = "no-files" | "types-not-first" | "types-not-declaration" | "outside-files";

export interface Problem {
  readonly rule: Rule;
  readonly where: string;
}

// Step 1: the file the exports map serves for this subpath and these conditions, or null.
export function resolveExport(packageJson: string, subpath: string, conditions: readonly string[]): string | null {
  throw new Error("Not implemented");
}

// Step 2: every problem with exports and files, in any order.
// posix.normalize is imported for you.
export function checkPackage(packageJson: string): Problem[] {
  throw new Error("Not implemented");
}
