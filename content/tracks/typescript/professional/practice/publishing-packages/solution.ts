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

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parse(packageJson: string): JsonObject {
  const pkg: unknown = JSON.parse(packageJson);
  if (!isObject(pkg)) throw new TypeError("package.json must hold a JSON object");
  return pkg;
}

/** The exports field as a map from each public subpath to its target. */
function subpaths(exportsField: unknown): Map<string, unknown> {
  if (typeof exportsField === "string") return new Map([[".", exportsField]]);
  if (!isObject(exportsField)) return new Map();
  const keys = Object.keys(exportsField);
  if (keys.length > 0 && keys.every((key) => key.startsWith("."))) {
    return new Map(Object.entries(exportsField));
  }
  return new Map([[".", exportsField]]); // conditions without subpaths describe "."
}

/** Tries the conditions in the package's order; the first one that leads to a file wins. */
function resolveTarget(target: unknown, conditions: readonly string[]): string | null {
  if (typeof target === "string") return target;
  if (!isObject(target)) return null;
  for (const [condition, value] of Object.entries(target)) {
    if (condition !== "default" && !conditions.includes(condition)) continue;
    const resolved = resolveTarget(value, conditions);
    if (resolved !== null) return resolved;
  }
  return null;
}

export function resolveExport(packageJson: string, subpath: string, conditions: readonly string[]): string | null {
  const map = subpaths(parse(packageJson)["exports"]);
  return map.has(subpath) ? resolveTarget(map.get(subpath), conditions) : null;
}

const DECLARATION_FILES = [".d.ts", ".d.mts", ".d.cts"];

/** The entries of files as normalized paths, or undefined when files is missing or empty. */
function fileEntries(files: unknown): string[] | undefined {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  const entries: string[] = [];
  for (const entry of files) {
    if (typeof entry !== "string") return undefined;
    entries.push(posix.normalize(entry).replace(/\/$/, ""));
  }
  return entries;
}

export function checkPackage(packageJson: string): Problem[] {
  const pkg = parse(packageJson);
  const problems: Problem[] = [];
  const files = fileEntries(pkg["files"]);
  if (files === undefined) problems.push({ rule: "no-files", where: "files" });

  function inFiles(target: string, entries: readonly string[]): boolean {
    const path = posix.normalize(target);
    return entries.some((entry) => path === entry || path.startsWith(entry + "/"));
  }

  function walk(subpath: string, target: unknown, condition: string | undefined): void {
    if (typeof target === "string") {
      if (condition === "types" && !DECLARATION_FILES.some((extension) => target.endsWith(extension))) {
        problems.push({ rule: "types-not-declaration", where: target });
      }
      if (files !== undefined && target !== "./package.json" && !inFiles(target, files)) {
        problems.push({ rule: "outside-files", where: target });
      }
      return;
    }
    if (!isObject(target)) return;
    const keys = Object.keys(target);
    if (keys.includes("types") && keys[0] !== "types") problems.push({ rule: "types-not-first", where: subpath });
    for (const key of keys) walk(subpath, target[key], key);
  }

  for (const [subpath, target] of subpaths(pkg["exports"])) walk(subpath, target, undefined);
  return problems;
}
