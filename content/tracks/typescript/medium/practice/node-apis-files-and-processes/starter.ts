// Houseplant Watering Journal
//
// The imports, isNodeError and the last three lines are complete. Write the three exported
// functions and main. Tests import the functions, and run the file as a program to test main.

import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

// Task 1
export async function readJournal(file: string): Promise<string[]> {
  throw new Error("Not implemented");
}

// Task 2: write <file>.tmp, then rename it over <file>.
export async function saveSchedule(file: string, schedule: Record<string, number>): Promise<void> {
  throw new Error("Not implemented");
}

// Task 3
export function intervalDays(env: NodeJS.ProcessEnv): number {
  throw new Error("Not implemented");
}

// Task 4: the program. args are the command-line arguments, process.argv.slice(2).
async function main(args: string[]): Promise<void> {
  throw new Error("Not implemented");
}

// Runs main only when this file is run as a program, not when a test imports it.
if (import.meta.main) {
  await main(process.argv.slice(2));
}
