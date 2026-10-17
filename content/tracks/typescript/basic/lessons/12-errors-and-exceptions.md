---
title: Errors and Exceptions
summary: Stop a function with throw, recover with try, catch and finally, know the built-in Error types, narrow the unknown catch variable, wrap errors with cause, write a custom error class, and decide when to throw and when to return a value instead.
minutes: 30
objectives:
  - Throw an `Error` with a useful message and explain what an uncaught exception does
  - Use `try`, `catch` and `finally`, and narrow the `unknown` catch variable with `instanceof`
  - Name the common built-in error types and wrap an error with `cause`
  - Write a small custom error class, and choose between throwing and returning a value
---

## Outline

1. `throw` and the `Error` object
2. `try`, `catch` and `finally`
3. The catch variable is `unknown`
4. Built-in error types
5. Wrapping an error with `cause`
6. A custom error class
7. Throw, or return a value?

## `throw` and the `Error` object

Sometimes a function cannot do its job: the input is wrong, or something it relies on has failed.
It can then **throw** an **exception**: `throw` stops the function at once and passes an error
object up to whoever called it, and up again, until some code catches it. The usual thing to throw
is an `Error`, created with `new Error(message)`:

```ts
function minutesFromTime(text: string): number {
  const parts = text.split(":");
  if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
    throw new Error(`Expected HH:MM, got "${text}"`);
  }
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error(`Expected HH:MM, got "${text}"`);
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new RangeError(`Time out of range: "${text}"`);
  }
  return hours * 60 + minutes;
}

console.log(minutesFromTime("14:30"));
console.log(minutesFromTime("1430"));
console.log("never printed");
```

```text
870
/tmp/work/main.ts:4
    throw new Error(`Expected HH:MM, got "${text}"`);
          ^

Error: Expected HH:MM, got "1430"
    at minutesFromTime (/tmp/work/main.ts:4:11)
    at <anonymous> (/tmp/work/main.ts:18:13)
```

(The rest of the stack trace is cut here.) Nothing caught the error, so Node.js printed it and
stopped the program with exit code 1; the last line never ran. The **stack trace** lists the
chain of calls that led to the `throw`, newest first, with file, line and column. Every error has
a `message`, a `name` (here `"Error"`) and that `stack`. Write messages that say what was wrong and
include the offending value.

## `try`, `catch` and `finally`

To handle an error instead of crashing, put the code that might throw in a `try` block. If
anything in it throws, the rest of the block is skipped and the `catch` block runs with the error.
A `finally` block runs afterwards in every case, error or not:

```ts
for (const text of ["09:15", "25:00", "noon"]) {
  try {
    console.log(`${text} is minute ${minutesFromTime(text)} of the day`);
  } catch (error) {
    if (error instanceof RangeError) {
      console.log(`Out of range: ${error.message}`);
    } else if (error instanceof Error) {
      console.log(`Bad input: ${error.message}`);
    } else {
      throw error;
    }
  } finally {
    console.log(`(checked ${text})`);
  }
}
```

```text
09:15 is minute 555 of the day
(checked 09:15)
Out of range: Time out of range: "25:00"
(checked 25:00)
Bad input: Expected HH:MM, got "noon"
(checked noon)
```

The loop goes on after each failure, because each error was caught. `finally` is for cleanup that
must happen whatever went wrong. Anything the `catch` does not know how to handle should be thrown
again, as the last branch does, rather than ignored.

## The catch variable is `unknown`

JavaScript lets a program throw *any* value, not only errors: `throw "oops"` and `throw 42` are
legal. So the compiler cannot know what `error` is, and with `strict` (through its
`useUnknownInCatchVariables` check) its type is `unknown`:

```ts
try {
  minutesFromTime("noon");
} catch (error) {
  console.log(error.message);
}
```

```text
main.ts(20,15): error TS18046: 'error' is of type 'unknown'.
```

Narrow it first, as the loop above did: `error instanceof Error` proves it is an error and makes
`message` available. If you do not need the value at all, write `catch { ... }` without the
parentheses.

## Built-in error types

JavaScript itself throws errors of several kinds, all subclasses of `Error`: `TypeError` (a value
of the wrong kind, such as reading a property of `undefined`), `RangeError` (a number outside the
allowed range), `SyntaxError` (text that cannot be parsed) and `ReferenceError` (a name that does
not exist, which the compiler normally catches first):

```ts
function describeFailure(action: () => unknown): string {
  try {
    action();
    return "no error";
  } catch (error) {
    return error instanceof Error ? `${error.name}: ${error.message}` : `not an Error: ${String(error)}`;
  }
}

console.log(describeFailure(() => JSON.parse("{oops")));
console.log(describeFailure(() => (1.5).toFixed(200)));
console.log(describeFailure(() => "abc".repeat(-1)));
console.log(describeFailure(() => {
  throw "just a string";
}));
```

```text
SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
RangeError: toFixed() digits argument must be between 0 and 100
RangeError: Invalid count value: -1
not an Error: just a string
```

Your own code can throw these too, as `minutesFromTime` throws a `RangeError` for a time that has
the right shape but impossible numbers.

## Wrapping an error with `cause`

A low-level error message often lacks context ("Expected HH:MM" on which line?). Catch it and
throw a new error that adds the context, passing the original as `cause` so nothing is lost:

```ts
function startOf(line: string, lineNumber: number): number {
  try {
    return minutesFromTime(line);
  } catch (error) {
    throw new Error(`Line ${lineNumber}: cannot read the start time`, { cause: error });
  }
}

try {
  startOf("7.30", 3);
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message);
    console.log("Because:", error.cause instanceof Error ? error.cause.message : error.cause);
  }
}
```

```text
Line 3: cannot read the start time
Because: Expected HH:MM, got "7.30"
```

`cause` has the type `unknown`, for the same reason the catch variable does.

## A custom error class

When callers need to tell your errors apart, or need extra data such as a line number, define your
own error type. A **class** describes a kind of object; the medium level covers classes fully, and
this pattern is all you need for now:

```ts
class InputError extends Error {
  line: number;

  constructor(message: string, line: number) {
    super(message);
    this.name = "InputError";
    this.line = line;
  }
}

function checkHeader(text: string): void {
  if (!text.startsWith("TIMESHEET")) {
    throw new InputError("The first line must be TIMESHEET", 1);
  }
}

try {
  checkHeader("TIMESHEAT v2");
} catch (error) {
  if (error instanceof InputError) {
    console.log(`${error.name} on line ${error.line}: ${error.message}`);
  } else {
    throw error;
  }
}
```

```text
InputError on line 1: The first line must be TIMESHEET
```

`extends Error` makes every `InputError` an `Error` too. The `constructor` runs when
`new InputError(...)` creates one; `super(message)` lets `Error` set up the message and stack, and
`this` is the new object. Setting `this.name` makes stack traces and messages show `InputError`.
Declare `line` as a field and assign it, as here; the shorter "parameter property" form,
`constructor(readonly line: number)`, is one of the features Node's type stripping refuses (lesson
2).

## Throw, or return a value?

- **Return a value** for outcomes that are a normal part of the job. A line of user input that
  does not parse is expected, so `parseSize` in lesson 11 returned `undefined`, and the caller
  handled it with an ordinary `if`.
- **Throw** when continuing makes no sense: a broken rule that means there is a bug, a missing
  file the program cannot work without, or an error the current function cannot handle and its
  caller might.

A function that throws for every bad line forces `try` around every call; one that returns
`undefined` or a union makes the compiler remind the caller to handle the failure.

## Common mistakes

- **Using the catch variable unchecked.** TS18046, as shown. Narrow with `instanceof Error`.
- **Throwing a string.** `throw "bad input"` has no stack trace and fails `instanceof Error`. Throw
  `new Error("bad input")`.
- **An empty `catch`.** `catch { }` hides every failure, including bugs you have not thought of.
  Handle the errors you expect and rethrow the rest.
- **Expecting code after `return` in `try` to beat `finally`.** `finally` still runs:

  ```ts
  function tryIt(): string {
    try {
      console.log("try");
      return "from try";
    } finally {
      console.log("finally");
    }
  }
  console.log(tryIt());
  ```

  ```text
  try
  finally
  from try
  ```

## Practice

1. Write `safeParseJson(text: string): unknown` that returns `undefined` when `JSON.parse` throws.
2. Write a `ValidationError` class with a `field` property, throw one from `checkAge(age: number)`
   for a negative or fractional age, and print its field and message.
3. In the loop of the `try` section, what would happen to `"noon"` without the
   `error instanceof Error` branch?

### Answers

Exercises 1 and 2:

```ts
function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

class ValidationError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

function checkAge(age: number): number {
  if (!Number.isInteger(age) || age < 0) {
    throw new ValidationError("age", `Not a valid age: ${age}`);
  }
  return age;
}

console.log(safeParseJson("[1, 2]"), safeParseJson("{oops"));
try {
  checkAge(-4);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.field, "|", error.message);
  }
}
```

```text
[ 1, 2 ] undefined
age | Not a valid age: -4
```

Exercise 3: it is a plain `Error`, not a `RangeError`, so it would reach the `else` and be thrown
again; `finally` would print `(checked noon)` and then the program would stop with the error.

## Key takeaways

- `throw new Error(message)` stops a function; an uncaught error prints a stack trace and ends the
  program with exit code 1.
- `try`/`catch` handles errors, `finally` always runs, and unknown errors should be rethrown.
- The catch variable is `unknown`; narrow it with `instanceof`.
- `TypeError`, `RangeError` and `SyntaxError` are built in; `{ cause }` wraps an error with context.
- A custom error class extends `Error`, sets `name` and adds fields.
- Return a value for expected failures; throw when the caller cannot simply carry on.

## Further reading

- [MDN: Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- [MDN: try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)
- [MDN: Error: cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
- [TSConfig reference: useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables)
