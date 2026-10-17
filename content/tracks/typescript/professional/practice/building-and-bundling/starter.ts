// Florist Build Plan
//
// Predicts what tsc writes for each source file, and how it rewrites relative imports
// under rewriteRelativeImportExtensions.
import { posix } from "node:path";

/** The emit settings of a tsconfig.json that matter here. Paths are relative to the project folder. */
export interface EmitOptions {
  readonly rootDir: string;
  readonly outDir: string;
  readonly declaration?: boolean;
  readonly declarationMap?: boolean;
  readonly sourceMap?: boolean;
  readonly emitDeclarationOnly?: boolean;
  readonly noEmit?: boolean;
}

// Step 1: the specifier tsc writes into the JavaScript for an import written in the source.
export function rewriteImport(specifier: string): string {
  throw new Error("Not implemented");
}

// Step 2: the files tsc writes for one source file, in the order the instructions give.
// posix.relative and posix.join are imported for you.
export function emittedFiles(source: string, options: EmitOptions): string[] {
  throw new Error("Not implemented");
}
