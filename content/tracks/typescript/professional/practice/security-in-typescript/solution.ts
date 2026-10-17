// Pantry Notes Hardening
//
// Merging untrusted settings without prototype pollution, keeping uploaded files inside their
// folder, and a handle validator that no input can make slow.
import { posix } from "node:path";

export type Settings = Record<string, unknown>;

export type SafePath = string & { readonly __brand: "SafePath" };

// Complete: code that touches the disk accepts only checked paths.
export function describeUpload(path: SafePath): string {
  return `upload stored at ${path}`;
}

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(value: unknown): value is Settings {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeSettings(target: Settings, source: unknown): Settings {
  if (!isPlainObject(source)) throw new TypeError("settings must be a JSON object");
  for (const key of Object.keys(source)) {
    if (UNSAFE_KEYS.has(key)) continue; // never let a body reach Object.prototype
    const value = source[key];
    if (isPlainObject(value)) {
      const existing = Object.hasOwn(target, key) ? target[key] : undefined;
      target[key] = mergeSettings(isPlainObject(existing) ? existing : {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

export function safeJoin(root: string, requested: string): SafePath {
  if (requested.includes("\0")) throw new RangeError("a path must not contain a null byte");
  const full = posix.resolve(root, requested);
  const inside = posix.relative(root, full);
  if (inside === "" || inside === ".." || inside.startsWith("../") || posix.isAbsolute(inside)) {
    throw new RangeError(`${requested} is outside ${root}`);
  }
  return full as SafePath; // the only place a SafePath is made
}

export function isValidHandle(text: string): boolean {
  // Every separator must be followed by a letter or digit, so the input splits only one way.
  return text.length >= 3 && text.length <= 32 && /^[a-z0-9]+([-.][a-z0-9]+)*$/.test(text);
}
