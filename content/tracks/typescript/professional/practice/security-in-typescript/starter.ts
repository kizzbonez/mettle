// Pantry Notes Hardening
//
// Merging untrusted settings without prototype pollution, keeping uploaded files inside their
// folder, and a handle validator that no input can make slow.
import { posix } from "node:path";

export type Settings = Record<string, unknown>;

// Step 1: replace string with a branded type, so that only safeJoin can produce a SafePath.
export type SafePath = string;

// Complete: code that touches the disk accepts only checked paths.
export function describeUpload(path: SafePath): string {
  return `upload stored at ${path}`;
}

// Step 2: merge a parsed JSON body into the settings, skipping the dangerous keys.
export function mergeSettings(target: Settings, source: unknown): Settings {
  throw new Error("Not implemented");
}

// Step 3: the absolute path of a requested file, refused unless it is inside root.
// posix.resolve and posix.relative are imported for you.
export function safeJoin(root: string, requested: string): SafePath {
  throw new Error("Not implemented");
}

// Step 4: true for a valid handle. This version gives the right answers, but it nests a
// quantifier inside a quantifier: one crafted handle keeps it busy for hours. Rewrite it.
export function isValidHandle(text: string): boolean {
  return text.length >= 3 && text.length <= 32 && /^([a-z0-9]+[-.]?)*[a-z0-9]$/.test(text);
}
