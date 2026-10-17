import { readFileSync } from "node:fs";

// Step 1: replace `string` with a union of the four results: flash, top, zone and miss.
export type Result = string;

export interface Attempt {
  climber: string;
  problem: number;
  result: Result;
}

export interface Standing {
  climber: string;
  points: number;
  tops: number;
}

export function points(result: Result): number {
  throw new Error("Not implemented: points");
}

export function parseResult(text: string): Result | undefined {
  throw new Error("Not implemented: parseResult");
}

export function parseProblem(text: string): number | undefined {
  throw new Error("Not implemented: parseProblem");
}

export function parseLine(line: string): Attempt | string {
  throw new Error("Not implemented: parseLine");
}

export function standings(attempts: readonly Attempt[]): Standing[] {
  throw new Error("Not implemented: standings");
}

export function formatStanding(rank: number, standing: Standing): string {
  throw new Error("Not implemented: formatStanding");
}

function main(): void {
  // Read the whole sheet with readFileSync(0, "utf8"), then report as the instructions say.
  throw new Error("Not implemented: main");
}

if (import.meta.main) {
  main();
}
