// Station Config Audit
//
// Reads the text of a tsconfig.json (plain JSON, no comments) and answers two questions:
// which options TypeScript 7 refuses, and whether a check is really on.

/** The members of the strict family that the audit knows about. */
export const STRICT_FAMILY = [
  "noImplicitAny",
  "strictNullChecks",
  "strictFunctionTypes",
  "strictBindCallApply",
  "strictPropertyInitialization",
  "strictBuiltinIteratorReturn",
  "noImplicitThis",
  "useUnknownInCatchVariables",
] as const;

/** Checks outside the strict family. */
export const OTHER_FLAGS = [
  "noUncheckedIndexedAccess",
  "exactOptionalPropertyTypes",
  "noImplicitOverride",
  "verbatimModuleSyntax",
  "isolatedModules",
  "erasableSyntaxOnly",
] as const;

// Step 1: replace string with the exact union of "strict", the names in STRICT_FAMILY and the
// names in OTHER_FLAGS. Derive it from the two arrays instead of typing the names again.
export type Flag = string;

// Step 2: the names of the compiler options TypeScript 7 refuses, in the order they appear.
export function removedOptions(text: string): string[] {
  throw new Error("Not implemented");
}

// Step 3: whether the flag is on, once defaults and implied settings are taken into account.
export function isEnabled(text: string, flag: Flag): boolean {
  throw new Error("Not implemented");
}
