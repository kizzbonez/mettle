// Ski-Pass Desk
//
// The desk's new tablet app runs this file with Node's type stripping, which refuses enums.
// Task 1: replace this enum with an `as const` object named Pass, with the same names and codes,
// a type Pass for its codes, and a type PassName for its names.
export enum Pass {
  Morning = "AM",
  Day = "FULL",
  Week = "WEEK",
}

export type PassName = string;

// Task 2: keep these values as literal types, and derive Run from the array.
export const RUNS = ["green", "blue", "red", "black", "off-piste"];
export type Run = string;

// Task 3
export function isRun(value: string): value is Run {
  throw new Error("Not implemented");
}

// Task 4
export function lessonsRequired(run: Run): number {
  throw new Error("Not implemented");
}

// Task 5
export function passPrice(pass: Pass): number {
  throw new Error("Not implemented");
}

// Task 6
export function passLabel(name: PassName): string {
  throw new Error("Not implemented");
}
