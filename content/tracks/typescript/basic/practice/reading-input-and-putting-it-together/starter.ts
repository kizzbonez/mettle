import { readFileSync } from "node:fs";

// The temperature log of a restaurant's walk-in fridge.

export interface Reading {
  time: string;
  celsius: number;
}

export function parseReading(line: string): Reading | string {
  throw new Error("Not implemented");
}

export function parseLimit(text: string | undefined): number | undefined {
  throw new Error("Not implemented");
}

export function tooWarm(readings: readonly Reading[], limit: number): Reading[] {
  throw new Error("Not implemented");
}

function main(): void {
  // Read the limit from process.argv and the log with readFileSync(0, "utf8"),
  // then report as the instructions say.
  throw new Error("Not implemented");
}

if (import.meta.main) {
  main();
}
