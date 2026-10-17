---
title: JSON and Runtime Validation
summary: See why `JSON.parse` returning `any` lets bad data past the compiler, treat parsed data as `unknown`, narrow it step by step, write type guards and a validator that reports every problem and turns date strings into real dates, and know where schema libraries such as Zod fit.
minutes: 35
objectives:
  - Explain why a type annotation or `as` on `JSON.parse` checks nothing at run time
  - Narrow an `unknown` value to an object and its properties
  - Write a type guard and a validating parser that returns all errors as a discriminated union
  - Parse and check ISO date strings, and describe what a schema library adds
---

## Outline

1. Types end at the edge of your program
2. `JSON.parse` returns `any`
3. Start from `unknown`
4. A type guard for a shape
5. A parser that reports every problem
6. Dates in JSON
7. Schema libraries

## Types end at the edge of your program

Every type you have written so far is checked by the compiler and then erased. That is fine for
values your own code creates. But some values arrive from outside while the program runs: a file,
an HTTP request, a message queue, user input. The compiler never saw them, so no type annotation
can vouch for them. **Runtime validation** means checking such data with ordinary code, as it
arrives, and only then giving it a type. JSON is the most common way such data arrives.

## `JSON.parse` returns `any`

`JSON.parse(text)` turns JSON text into JavaScript values: objects, arrays, strings, numbers,
booleans and `null`. It throws a `SyntaxError` for text that is not valid JSON. Its TypeScript
return type is `any`, which switches checking off, so any annotation is accepted:

```ts
interface Pickup {
  id: string;
  boxes: number;
  due: string;
}

const text = '{"id":"P-17","boxes":"3"}';
const pickup: Pickup = JSON.parse(text);
console.log(pickup.boxes + 1);
console.log(pickup.due.slice(0, 4));
```

```text
31
/tmp/work/main.ts:10
console.log(pickup.due.slice(0, 4));
                       ^

TypeError: Cannot read properties of undefined (reading 'slice')
```

`boxes` was the string `"3"`, so `+ 1` joined strings and printed `31`; `due` was missing. Writing
`JSON.parse(text) as Pickup` is no better: `as` is a **type assertion**, which tells the compiler to
believe you and generates no code at all.

## Start from `unknown`

Store the result as `unknown` instead. `unknown` accepts any value but lets you do nothing with it
until you narrow it, so the compiler now forces the checks:

```ts
const text = '{"id":"P-17","boxes":"3"}';
const data: unknown = JSON.parse(text);
console.log(data.boxes);
if (typeof data === "object" && data !== null) {
  console.log(data.boxes);
  if ("boxes" in data) {
    console.log(data.boxes + 1);
    if (typeof data.boxes === "number") {
      console.log(data.boxes + 1);
    }
  }
}
```

```text
main.ts(3,13): error TS18046: 'data' is of type 'unknown'.
main.ts(5,20): error TS2339: Property 'boxes' does not exist on type 'object'.
main.ts(7,17): error TS18046: 'data.boxes' is of type 'unknown'.
```

Each check unlocks a little more. `typeof data === "object"` is also true for `null` (a famous
quirk), hence `data !== null`. After `"boxes" in data`, the property exists but is `unknown`. Only
after `typeof data.boxes === "number"` (line 9) is arithmetic allowed.

## A type guard for a shape

Writing those checks inline everywhere would be tiring. Package them in type guards from lesson 4.
A small helper first checks for a plain object and narrows it to `Record<string, unknown>`, which
lets you read any property as `unknown`:

```ts
interface Pickup {
  id: string;
  boxes: number;
  due: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPickup(value: unknown): value is Pickup {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.boxes === "number" &&
    Number.isInteger(value.boxes) &&
    typeof value.due === "string"
  );
}

const inputs = ['{"id":"P-17","boxes":3,"due":"2026-11-02"}', '{"id":"P-18","boxes":"3"}', "[1, 2]"];
for (const text of inputs) {
  const data: unknown = JSON.parse(text);
  if (isPickup(data)) {
    console.log(`${data.id}: ${data.boxes + 1} boxes with the extra`);
  } else {
    console.log("rejected:", text);
  }
}
```

```text
P-17: 4 boxes with the extra
rejected: {"id":"P-18","boxes":"3"}
rejected: [1, 2]
```

Arrays are objects too, so `isRecord` excludes them with `Array.isArray`. Remember that a guard
is a promise the compiler trusts: if `isPickup` forgot to check `due`, the type would lie.

## A parser that reports every problem

A guard answers yes or no. When a person must fix the input, they need to know *what* is wrong.
A **parser** returns either the typed value or a list of errors, using a discriminated union, and
can convert values on the way, such as a date string into a `Date`:

```ts
interface Pickup {
  id: string;
  boxes: number;
  due: Date;
}

type Parsed<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDay(text: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return undefined;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime()) || !date.toISOString().startsWith(text)) {
    return undefined;
  }
  return date;
}

function parsePickup(text: string): Parsed<Pickup> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["not valid JSON"] };
  }
  if (!isRecord(data)) {
    return { ok: false, errors: ["expected an object"] };
  }
  const id = typeof data.id === "string" && data.id !== "" ? data.id : undefined;
  const boxes =
    typeof data.boxes === "number" && Number.isInteger(data.boxes) && data.boxes > 0 ? data.boxes : undefined;
  const due = typeof data.due === "string" ? parseDay(data.due) : undefined;
  if (id === undefined || boxes === undefined || due === undefined) {
    const errors: string[] = [];
    if (id === undefined) {
      errors.push("id must be a non-empty string");
    }
    if (boxes === undefined) {
      errors.push("boxes must be a whole number above 0");
    }
    if (due === undefined) {
      errors.push("due must be a real date written YYYY-MM-DD");
    }
    return { ok: false, errors };
  }
  return { ok: true, value: { id, boxes, due } };
}

const inputs = [
  '{"id":"P-17","boxes":3,"due":"2026-11-02"}',
  '{"id":"","boxes":2.5,"due":"2026-02-30"}',
  '{"id":"P-19","boxes":"4","due":"2026-13-45"}',
  '{"id":"P-20",',
];
for (const text of inputs) {
  const result = parsePickup(text);
  if (result.ok) {
    console.log(result.value.id, result.value.boxes, result.value.due.toISOString());
  } else {
    console.log(result.errors.join("; "));
  }
}
```

```text
P-17 3 2026-11-02T00:00:00.000Z
id must be a non-empty string; boxes must be a whole number above 0; due must be a real date written YYYY-MM-DD
boxes must be a whole number above 0; due must be a real date written YYYY-MM-DD
not valid JSON
```

Each field is checked into a variable that is either the good value or `undefined`. After the
combined `if`, the compiler knows all three are defined, so the final object type-checks with no
assertion. `catch` without a variable is allowed when you do not need the error. The caller must
check `result.ok` before reading `result.value`, and the union makes forgetting impossible.

## Dates in JSON

JSON has no date type. Dates travel as strings, usually in the ISO 8601 form `2026-11-02` or
`2026-11-02T09:30:00Z`, which `new Date` parses reliably (a date-only string means midnight UTC).
Two traps make `parseDay` stricter than `new Date` alone:

- An impossible date gives an **Invalid Date**, whose `getTime()` is `NaN`, and calling
  `toISOString()` on it throws `RangeError: Invalid time value`. Check `Number.isNaN` first.
- An out-of-range day *rolls over*: `new Date("2026-02-30")` is 2 March. Comparing
  `toISOString()` with the input catches that.

Other formats such as `11/02/2026` are parsed by rules that depend on the engine and the time
zone. Accept ISO strings only.

## Schema libraries

Hand-written validators are worth writing once, to see what validation involves. In production,
most teams use a **schema library**, which builds the validator and the type from one
declaration. The best known is Zod, now at version 4:

```console
$ npm install zod
```

```ts
import * as z from "zod";

const Pickup = z.object({
  id: z.string(),
  boxes: z.number().int().positive(),
});
type Pickup = z.infer<typeof Pickup>;

const result = Pickup.safeParse(JSON.parse(text));
if (result.success) {
  console.log(result.data.boxes);
} else {
  console.log(result.error.issues);
}
```

`z.infer` derives the TypeScript type from the schema, as `typeof` derived types from values in
lesson 7, so the check and the type cannot drift apart. `safeParse` returns a discriminated union
like `Parsed<T>`; `parse` throws instead. Valibot and ArkType follow the same idea.

## Common mistakes

- **Annotating or asserting `JSON.parse`.** `const p: Pickup = JSON.parse(text)` and `as Pickup`
  check nothing. Use `unknown` and validate.
- **Forgetting `null` and arrays.** `typeof null` and `typeof []` are both `"object"`.
- **Trusting `new Date` with any string.** Check for `NaN` and for rollover.
- **Not catching `SyntaxError`.** Text from outside may not be JSON at all.

## Practice

1. Write `isStringArray(value: unknown): value is string[]`.
2. Write `parseBoxes(value: unknown): number | undefined` that accepts a whole number above 0, or
   a string of digits such as `"4"`.
3. Why does `const pickup = JSON.parse(text) as Pickup;` not protect the program?

### Answers

```ts
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseBoxes(value: unknown): number | undefined {
  const boxes = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof boxes === "number" && Number.isInteger(boxes) && boxes > 0 ? boxes : undefined;
}

console.log(isStringArray(JSON.parse('["dock 2", "dock 5"]')), isStringArray(JSON.parse('["dock 2", 5]')));
console.log(parseBoxes(3), parseBoxes("4"), parseBoxes("4.5"), parseBoxes(0), parseBoxes(null));
```

```text
true false
3 4 undefined undefined undefined
```

3. `as` only changes what the compiler believes. No code runs, so a missing or wrong field still
   reaches the program.

## Key takeaways

- Types are erased; data from outside must be checked by code at run time.
- `JSON.parse` returns `any`. Store it as `unknown` and narrow.
- Type guards say yes or no; a parser returning a discriminated union says what is wrong and can
  convert values.
- Accept ISO date strings and check for `NaN` and rollover. In production, a schema library such
  as Zod builds the validator and the type together.

## Further reading

- [MDN: JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [MDN: Date, including the date time string format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Zod: Basic usage](https://zod.dev/basics)
