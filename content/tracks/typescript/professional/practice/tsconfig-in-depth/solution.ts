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

type FamilyFlag = (typeof STRICT_FAMILY)[number];

export type Flag = "strict" | FamilyFlag | (typeof OTHER_FLAGS)[number];

type Options = Record<string, unknown>;

function isObject(value: unknown): value is Options {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The compilerOptions object of a tsconfig.json, or {} when it has none. */
function compilerOptionsOf(text: string): Options {
  const config: unknown = JSON.parse(text); // a SyntaxError for broken JSON goes to the caller
  if (!isObject(config)) throw new TypeError("a tsconfig.json must hold a JSON object");
  const options = config["compilerOptions"];
  if (options === undefined) return {};
  if (!isObject(options)) throw new TypeError("compilerOptions must be an object");
  return options;
}

// Options whose value decides, compared without case.
const REMOVED_VALUES = new Map<string, readonly string[]>([
  ["target", ["es5"]],
  ["module", ["amd", "umd", "system"]],
  ["moduleResolution", ["node", "node10", "classic"]],
]);
// Options that are refused whatever their value.
const REMOVED_NAMES = new Set(["baseUrl", "outFile", "downlevelIteration"]);
// Options that may no longer be turned off.
const NO_LONGER_FALSE = new Set(["esModuleInterop", "allowSyntheticDefaultImports", "alwaysStrict"]);

export function removedOptions(text: string): string[] {
  const removed: string[] = [];
  for (const [name, value] of Object.entries(compilerOptionsOf(text))) {
    const values = REMOVED_VALUES.get(name);
    if (
      REMOVED_NAMES.has(name) ||
      (NO_LONGER_FALSE.has(name) && value === false) ||
      (values !== undefined && typeof value === "string" && values.includes(value.toLowerCase()))
    ) {
      removed.push(name);
    }
  }
  return removed;
}

function isFamily(flag: Flag): flag is FamilyFlag {
  return (STRICT_FAMILY as readonly string[]).includes(flag);
}

/** The value the config sets for a flag, or undefined when it sets no boolean. */
function ownValue(options: Options, flag: Flag): boolean | undefined {
  const value = options[flag];
  return typeof value === "boolean" ? value : undefined;
}

function effective(options: Options, flag: Flag): boolean {
  const own = ownValue(options, flag);
  if (own !== undefined) return own;
  if (flag === "strict") return true; // the default since TypeScript 6
  if (isFamily(flag)) return effective(options, "strict");
  if (flag === "isolatedModules") return effective(options, "verbatimModuleSyntax");
  return false;
}

export function isEnabled(text: string, flag: Flag): boolean {
  return effective(compilerOptionsOf(text), flag);
}
