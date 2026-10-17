export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Why a reading could not be read. */
export type ReadingError =
  | { kind: "empty" }
  | { kind: "not-a-number"; text: string }
  | { kind: "negative"; value: number };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** A success with the reading, or a failure saying why; never throws. */
export function parseReading(text: string): Result<number, ReadingError> {
  const trimmed = text.trim();
  if (trimmed === "") return err({ kind: "empty" });
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return err({ kind: "not-a-number", text: trimmed });
  if (value < 0) return err({ kind: "negative", value });
  return ok(value);
}

/** A sentence for each kind of failure, checked exhaustively with `never`. */
export function explain(error: ReadingError): string {
  switch (error.kind) {
    case "empty":
      return "nothing was entered";
    case "not-a-number":
      return `"${error.text}" is not a number`;
    case "negative":
      return `${error.value} is below zero`;
    default: {
      const unhandled: never = error;
      return unhandled;
    }
  }
}

export class ReadingFailure extends Error {
  name = "ReadingFailure";
}

/** The sum of the readings, or one AggregateError listing every bad line. */
export function totalUsage(lines: readonly string[]): number {
  let total = 0;
  const failures: ReadingFailure[] = [];
  lines.forEach((line, index) => {
    const result = parseReading(line);
    if (result.ok) {
      total += result.value;
    } else {
      failures.push(new ReadingFailure(`line ${index + 1}: ${explain(result.error)}`, { cause: result.error }));
    }
  });
  if (failures.length > 0) {
    throw new AggregateError(failures, `${failures.length} reading(s) could not be read`);
  }
  return total;
}
