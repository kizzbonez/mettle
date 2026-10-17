Complete `solution.ts`. `ReadingError` is given. Hidden tests check `Result` with an exact type
comparison and `@ts-expect-error` lines, so it must rule out impossible states.

1. **`Result<T, E>`** is a discriminated union on `ok`: `{ ok: true; value: T }` or
   `{ ok: false; error: E }`, so a caller cannot read `value` before checking `ok`, and no result
   can hold both a value and an error. The starter's version with optional fields allows both.
2. **`parseReading(text: string): Result<number, ReadingError>`** trims the text and returns:
   - `{ kind: "empty" }` when nothing is left;
   - `{ kind: "not-a-number", text }`, with the trimmed text, when `Number(trimmed)` is not a
     finite number (`Number.isFinite`);
   - `{ kind: "negative", value }` when the number is below zero;
   - otherwise a success with the number.
   It never throws.
3. **`explain(error: ReadingError): string`** returns `nothing was entered`,
   `"12kg" is not a number` (the text in double quotes) or `-3 is below zero`. Use a `switch` on
   `kind` with a `default` branch that assigns `error` to a `never` variable, so a new kind would
   not compile until it is explained.
4. **`ReadingFailure`** is an error class: it extends `Error` and sets `name` to
   `"ReadingFailure"`. Its constructor is the one it inherits, `(message, { cause })`.
5. **`totalUsage(lines: readonly string[]): number`** parses every line and returns the sum of
   the readings. If any line fails, it reads all the others anyway and then throws one
   `AggregateError` with the message `` `${count} reading(s) could not be read` `` whose `errors`
   are `ReadingFailure`s in line order, each with the message `` `line ${n}: ${explanation}` ``
   (lines count from 1) and the `ReadingError` object as its `cause`. No lines total `0`.

Example:

```ts
parseReading(" 42.5 ");             // { ok: true, value: 42.5 }
parseReading("12kg");               // { ok: false, error: { kind: "not-a-number", text: "12kg" } }
parseReading("5").value;            // compile error: check ok first
explain({ kind: "negative", value: -3 });  // "-3 is below zero"

totalUsage(["10", "4.5"]);          // 14.5
totalUsage(["10", "", "-2"]);       // throws AggregateError "2 reading(s) could not be read":
                                    //   ReadingFailure "line 2: nothing was entered", cause { kind: "empty" }
                                    //   ReadingFailure "line 3: -2 is below zero", cause { kind: "negative", value: -2 }
```
