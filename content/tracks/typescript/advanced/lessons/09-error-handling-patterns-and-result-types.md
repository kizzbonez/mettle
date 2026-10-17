---
title: Error Handling Patterns and Result Types
summary: Wrap errors with cause to keep their history, return Result values for failures callers must handle, make the compiler check that every kind of error is handled, and report several failures at once with AggregateError.
minutes: 35
objectives:
  - Define an error class, wrap a lower-level error with `cause`, and print the whole chain
  - Write a `Result<T, E>` type and functions that return it instead of throwing
  - Model failures as a discriminated union and handle them exhaustively with `never`
  - Collect several failures with `AggregateError`, `Promise.any` and `Promise.allSettled`
---

## Outline

1. What `throw` does not tell the caller
2. Error classes and `cause`
3. Result types
4. Exhaustive error handling
5. Many failures at once: `AggregateError`
6. Throw or return?

## What `throw` does not tell the caller

The basic level taught `throw`, `try`/`catch` and custom error classes. Exceptions have two
weaknesses that grow with a program. First, a function's type does not say what it throws:
`function readPort(text: string): number` may throw on every call, and nothing reminds the caller
to handle it. Second, in a `catch` block the error is `unknown` (strict mode turns on
`useUnknownInCatchVariables`), because any value can be thrown and the error may come from code
far away. This lesson keeps exceptions for what they do well and adds a typed alternative.

## Error classes and `cause`

A low-level error ("Unexpected token") means little to the person who started the program. Wrap
it in an error that says what was being done, and keep the original as its **`cause`**, so no
detail is lost:

```ts
class ConfigError extends Error {
  name = "ConfigError";
}

function readPort(text: string): number {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ConfigError("config is not valid JSON", { cause: error });
  }
  if (typeof parsed !== "object" || parsed === null || !("port" in parsed) || typeof parsed.port !== "number") {
    throw new ConfigError("config has no numeric port", { cause: parsed });
  }
  return parsed.port;
}

function describe(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    parts.push(`${current.name}: ${current.message}`);
    current = current.cause;
  }
  if (current !== undefined) parts.push(JSON.stringify(current));
  return parts.join("\n  caused by ");
}

for (const text of ['{"port": 8080}', "port=80", '{"port": "80"}']) {
  try {
    console.log("port", readPort(text));
  } catch (error) {
    console.log(describe(error));
  }
}
```

```text
port 8080
ConfigError: config is not valid JSON
  caused by SyntaxError: Unexpected token 'p', "port=80" is not valid JSON
ConfigError: config has no numeric port
  caused by {"port":"80"}
```

`ConfigError` inherits the constructor of `Error`, whose second argument is the options object
with `cause`. Setting `name` makes the class show in messages and stack traces. A `cause` may be
any value, so `describe` checks `instanceof Error` at every step. `instanceof` is also how a
`catch` block narrows `unknown` to a class it can handle; anything else it should rethrow.

## Result types

For failures a caller is expected to handle, such as invalid input or a missing record, return
the failure as a value. A **Result** type is a discriminated union of success and failure:

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

type ParseError =
  | { kind: "empty" }
  | { kind: "not-a-number"; text: string }
  | { kind: "out-of-range"; value: number };

function parsePercent(text: string): Result<number, ParseError> {
  const trimmed = text.trim();
  if (trimmed === "") return err({ kind: "empty" });
  const value = Number(trimmed);
  if (Number.isNaN(value)) return err({ kind: "not-a-number", text: trimmed });
  if (value < 0 || value > 100) return err({ kind: "out-of-range", value });
  return ok(value);
}

function explain(error: ParseError): string {
  switch (error.kind) {
    case "empty":
      return "nothing was entered";
    case "not-a-number":
      return `"${error.text}" is not a number`;
    case "out-of-range":
      return `${error.value} is not between 0 and 100`;
    default: {
      const unhandled: never = error;
      return unhandled;
    }
  }
}

for (const input of ["42", " ", "abc", "150"]) {
  const result = parsePercent(input);
  console.log(result.ok ? `ok ${result.value}` : `error: ${explain(result.error)}`);
}
```

```text
ok 42
error: nothing was entered
error: "abc" is not a number
error: 150 is not between 0 and 100
```

The signature now says what can go wrong, and the caller cannot reach the value without checking.
`ok` returns `Result<T, never>`, which fits any `Result<T, E>` because `never` is assignable to
every type. The misuse, appended:

```ts
const unchecked = parsePercent("5").value;
```

```text
main.ts(38,37): error TS2339: Property 'value' does not exist on type 'Result<number, ParseError>'.
  Property 'value' does not exist on type '{ ok: false; error: ParseError; }'.
```

Each error is a plain object with a `kind` and the data needed to explain it, which is easy to
log, test and translate into a user's language.

## Exhaustive error handling

The `default` branch of `explain` assigns `error` to a variable of type `never`. When every kind
is handled, nothing reaches it, so this compiles. Now add a fourth kind to the union,
`| { kind: "not-whole"; value: number }`, without updating `explain`:

```text
main.ts(29,13): error TS2322: Type '{ kind: "not-whole"; value: number; }' is not assignable to type 'never'.
```

The compiler lists exactly the failures nobody handles yet. With thrown exceptions, the new
failure would surface only when it happens in production.

## Many failures at once: `AggregateError`

Sometimes one operation fails in several ways at once. **`AggregateError`** is an `Error` holding
a list in its `errors` property. `Promise.any` resolves with the first success and rejects with
an `AggregateError` only if every promise rejects. `Promise.allSettled` never rejects; it reports
each outcome, and you can bundle the failures yourself:

```ts
async function download(mirror: string): Promise<string> {
  await null;
  if (mirror === "asia") return `file from ${mirror}`;
  throw new Error(`${mirror} is down`);
}

console.log(await Promise.any(["eu", "us", "asia"].map(download)));

try {
  await Promise.any(["eu", "us"].map(download));
} catch (error) {
  if (error instanceof AggregateError) {
    console.log(`${error.name}: ${error.message}`);
    for (const reason of error.errors) console.log("  because", String(reason));
  }
}

const settled = await Promise.allSettled(["eu", "asia"].map(download));
const failures = settled.filter((outcome) => outcome.status === "rejected").map((outcome) => outcome.reason);
console.log(settled.map((outcome) => outcome.status), failures.length);
if (failures.length > 0) {
  const batch = new AggregateError(failures, "some mirrors failed");
  console.log(batch.message, batch.errors.length);
}
```

```text
file from asia
AggregateError: All promises were rejected
  because Error: eu is down
  because Error: us is down
[ 'rejected', 'fulfilled' ] 1
some mirrors failed 1
```

The filter's callback narrows each outcome to `PromiseRejectedResult`, so `outcome.reason` is
allowed. The `errors` array is typed `any[]`: treat each entry as `unknown`.

## Throw or return?

- **Return a Result** for failures that are part of normal use: bad input, a record not found, a
  rule broken. The caller must decide what to do, and the type makes sure it does.
- **Throw** for bugs and broken assumptions (a value that cannot happen, a missing file the
  program ships with) and for failures nobody nearby can handle. Let them travel to one place,
  such as the top of a request handler, that logs them with their `cause` chain.
- **Convert at the boundary.** Library calls such as `JSON.parse` throw; wrap them once (the first
  practice exercise) and work with Results inside.

## Common mistakes

- **Throwing strings.** `throw "failed"` has no stack and no `cause`; throw an `Error`.
- **Swallowing errors.** An empty `catch {}` hides failures. Handle, wrap and rethrow, or let the
  error travel.
- **Losing the original** when rethrowing a new error: pass `{ cause: error }`.
- **A `default` branch that returns a fallback** instead of assigning to `never`; new kinds then
  pass silently.

## Practice

1. Write `attempt(fn)`, which calls `fn` and returns a `Result<T, Error>` instead of throwing.
2. Write `mapResult(result, fn)`, which transforms the value of a success and passes a failure
   through unchanged.

### Answers

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

function attempt<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

const good = mapResult(attempt((): unknown => JSON.parse("[1, 2, 3]")), (data) => Array.isArray(data));
const bad = attempt((): unknown => JSON.parse("{oops"));
console.log(good, bad.ok ? bad.value : bad.error.name);
```

```text
{ ok: true, value: true } SyntaxError
```

In `mapResult`, a failure can be returned as it is: once `result.ok` is false, it is a
`{ ok: false; error: E }`, which fits `Result<U, E>` for any `U`.

## Key takeaways

- Wrap low-level errors with `{ cause }` to add context without losing detail.
- A `Result<T, E>` puts expected failures in the signature and forces a check.
- Failure kinds as a discriminated union, handled with a `never` default, are checked exhaustively.
- `AggregateError` carries many errors; `Promise.any` throws one, and `allSettled` lets you build one.

## Further reading

- [MDN: Error: cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
- [MDN: AggregateError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError)
- [TypeScript Handbook: Narrowing, exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
