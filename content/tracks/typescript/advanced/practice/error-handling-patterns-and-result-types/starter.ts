// Meter Reading Import
//
// Follow the TODOs, and replace every `throw new Error("Not implemented")` with the real code.

// TODO 1: optional fields allow a result with both a value and an error, or neither.
// Make Result a discriminated union on `ok`.
export type Result<T, E> = { ok: boolean; value?: T; error?: E };

/** Why a reading could not be read. Complete: do not change it. */
export type ReadingError =
  | { kind: "empty" }
  | { kind: "not-a-number"; text: string }
  | { kind: "negative"; value: number };

/** 2: a success with the reading, or a failure saying why; never throws. */
export function parseReading(text: string): Result<number, ReadingError> {
  throw new Error("Not implemented");
}

/** 3: a sentence for each kind of failure, checked exhaustively with `never`. */
export function explain(error: ReadingError): string {
  throw new Error("Not implemented");
}

// TODO 4: give the class its name.
export class ReadingFailure extends Error {}

/** 5: the sum of the readings, or one AggregateError listing every bad line. */
export function totalUsage(lines: readonly string[]): number {
  throw new Error("Not implemented");
}
