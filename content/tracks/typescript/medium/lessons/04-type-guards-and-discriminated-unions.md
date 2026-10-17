---
title: Type Guards and Discriminated Unions
summary: Write your own narrowing functions with type predicates (`value is T`) and assertion functions (`asserts value is T`), model data whose shape depends on a tag with discriminated unions, and make the compiler prove that a `switch` handles every case with `never`.
minutes: 35
objectives:
  - Write a user-defined type guard with a `value is T` return type and use it with `if` and `filter`
  - Write an assertion function and explain the explicit annotation it requires
  - Model a set of related shapes as a discriminated union and narrow it with `switch`
  - Make a `switch` exhaustive with `never` so that adding a case becomes a compile error
---

## Outline

1. Narrowing, a reminder
2. User-defined type guards
3. Assertion functions
4. Discriminated unions
5. Exhaustive checks with `never`
6. Why unions beat optional fields

## Narrowing, a reminder

The basic level showed **narrowing**: inside `if (typeof x === "string")`, the compiler treats `x`
as a `string`. It also narrows with `===`, `in`, `instanceof` and `Array.isArray`. Those checks
work where you write them, but the knowledge stays there. Call a function that does the check
and returns `boolean`, and the compiler learns nothing, because a `boolean` says nothing about
the argument. This lesson gives such functions a way to report what they proved.

## User-defined type guards

A **type predicate** is a return type of the form `parameterName is Type`. A function with one is a
**user-defined type guard**: when it returns `true`, the compiler narrows the argument to `Type`,
and when it returns `false`, to the rest of the union:

```ts
interface Photo {
  url: string;
  width: number;
}

interface Video {
  url: string;
  seconds: number;
}

type Media = Photo | Video;

function isVideo(item: Media): item is Video {
  return "seconds" in item;
}

const gallery: Media[] = [
  { url: "dunes.jpg", width: 1200 },
  { url: "tide.mp4", seconds: 42 },
  { url: "gulls.mp4", seconds: 8 },
];

const videos = gallery.filter(isVideo);
const totalSeconds = videos.reduce((sum, video) => sum + video.seconds, 0);
console.log(videos.length, totalSeconds);

for (const item of gallery) {
  if (isVideo(item)) {
    console.log(`${item.url}: ${item.seconds} s`);
  } else {
    console.log(`${item.url}: ${item.width} px wide`);
  }
}
```

```text
2 50
dunes.jpg: 1200 px wide
tide.mp4: 42 s
gulls.mp4: 8 s
```

`filter` understands type guards: `gallery.filter(isVideo)` is a `Video[]`, so `video.seconds`
type-checks. In the `else` branch, `item` is a `Photo`. Now add the same check returning plain
`boolean` to the end of the program:

```ts
function looksLikeVideo(item: Media): boolean {
  return "seconds" in item;
}

const first = gallery[0];
if (looksLikeVideo(first)) {
  console.log(first.seconds);
}
```

```text
main.ts(41,21): error TS2339: Property 'seconds' does not exist on type 'Media'.
  Property 'seconds' does not exist on type 'Photo'.
```

Since TypeScript 5.5 the compiler also **infers** a predicate for simple arrow functions:
`gallery.filter((item) => "seconds" in item)` is already a `Video[]`. Write the predicate
yourself for named, reusable checks.

A type guard is a promise. The compiler does not check that the body really proves the
predicate: `return true` would compile and lie. Keep guard bodies short and obviously right.

## Assertion functions

Sometimes the right response to a failed check is to throw, not to branch. An **assertion
function** has the return type `asserts value is Type`: if it returns at all, the argument has
that type for the rest of the scope.

```ts
function assertIsString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string, got ${typeof value}`);
  }
}

function shout(input: unknown): string {
  assertIsString(input, "input");
  return input.toUpperCase();
}

console.log(shout("tide is in"));
try {
  shout(42);
} catch (error) {
  console.log(error instanceof TypeError ? error.message : error);
}
```

```text
TIDE IS IN
input must be a string, got number
```

After `assertIsString(input, "input")`, `input` is a `string` with no `if` around it. There is
one rule to know. The compiler must see the assertion signature before it analyzes the call, so
an arrow function stored in a `const` without a type annotation does not count:

```ts
const assertIsNumber = (value: unknown): asserts value is number => {
  if (typeof value !== "number") {
    throw new TypeError("not a number");
  }
};

function double(input: unknown): number {
  assertIsNumber(input);
  return input * 2;
}
```

```text
main.ts(8,3): error TS2775: Assertions require every name in the call target to be declared with an explicit type annotation.
main.ts(9,10): error TS18046: 'input' is of type 'unknown'.
```

Declare assertion functions with `function`, as `assertIsString` is.

## Discriminated unions

A **discriminated union** is a union of object types that all share one property, the
**discriminant** (or tag), whose type in each member is a different literal. Checking the tag
narrows to exactly one member:

```ts
type ParcelEvent =
  | { kind: "scanned"; depot: string }
  | { kind: "out-for-delivery"; driver: string }
  | { kind: "delivered"; signedBy: string }
  | { kind: "failed"; reason: string; retryDay: number };

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

function describe(event: ParcelEvent): string {
  switch (event.kind) {
    case "scanned":
      return `Scanned at ${event.depot}`;
    case "out-for-delivery":
      return `Out with ${event.driver}`;
    case "delivered":
      return `Signed for by ${event.signedBy}`;
    case "failed":
      return `Failed (${event.reason}), retry on day ${event.retryDay}`;
    default:
      return assertNever(event);
  }
}

const history: ParcelEvent[] = [
  { kind: "scanned", depot: "Porto" },
  { kind: "failed", reason: "nobody home", retryDay: 3 },
  { kind: "delivered", signedBy: "R. Costa" },
];
for (const event of history) {
  console.log(describe(event));
}
```

```text
Scanned at Porto
Failed (nobody home), retry on day 3
Signed for by R. Costa
```

Inside `case "failed":`, `event` has `reason` and `retryDay`; inside `case "scanned":` it has only
`depot`. Using the wrong field is caught: `event.driver` under `"scanned"` gives "Property
'driver' does not exist on type '{ kind: "scanned"; depot: string; }'."

## Exhaustive checks with `never`

`never` is the type with no values. After the four cases, nothing is left of the union, so in
`default` the compiler gives `event` the type `never`, and passing it to `assertNever(value:
never)` is allowed. Now someone adds a member, `| { kind: "returned"; to: string }`, and forgets
`describe`:

```text
main.ts(23,26): error TS2345: Argument of type '{ kind: "returned"; to: string; }' is not assignable to parameter of type 'never'.
```

The compiler names the case you missed. Without the `default`, a missing case can slip through
quietly in a function that returns nothing. If the function has a declared return type, you get
error TS2366, "Function lacks ending return statement and return type does not include
'undefined'", which is less precise. If bad data ever reaches `default` at run time (from JSON,
for instance), `assertNever` throws with the value in the message.

## Why unions beat optional fields

Compare one interface with optional fields, `{ status: string; driver?: string; signedBy?:
string }`, with the union above. The interface allows nonsense: a delivered parcel with no
signature, or a scanned one with a driver. Every reader must check for `undefined`. The union
allows only the combinations that exist, and the tag tells the compiler which fields are there.
This is often summed up as *making illegal states unrepresentable*.

## Common mistakes

- **Returning `boolean` from a check** and expecting narrowing: error TS2339 at the use. Return
  `x is T`.
- **A guard that lies.** `function isVideo(item: Media): item is Video { return true; }` compiles.
  Test guards like any other code.
- **An unannotated arrow as an assertion function**: error TS2775. Use a `function` declaration.
- **A `default` that hides new cases**, such as `default: return "unknown";`. It compiles forever,
  even after a new member is added. Use `assertNever` in `default`.

## Practice

1. Write `isNonEmptyString(value: unknown): value is string` (a string that is not only spaces) and
   use it to filter `["kiosk 4", "", 17, "  ", "gate B"]` into a `string[]`.
2. Model a `Ticket` as `single` (with `zones`), `day-pass`, or `concession` (with `zones` and
   `percentOff`). Write `price(ticket)`: 1.5 per zone, 6 for a day pass, and the zone price less
   the percentage for a concession. Make the `switch` exhaustive.
3. In your answer to 2, what does the compiler say if you delete the `"day-pass"` case?

### Answers

```ts
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

type Ticket =
  | { kind: "single"; zones: number }
  | { kind: "day-pass" }
  | { kind: "concession"; zones: number; percentOff: number };

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

function price(ticket: Ticket): number {
  switch (ticket.kind) {
    case "single":
      return 1.5 * ticket.zones;
    case "day-pass":
      return 6;
    case "concession":
      return 1.5 * ticket.zones * (1 - ticket.percentOff / 100);
    default:
      return assertNever(ticket);
  }
}

const raw: unknown[] = ["kiosk 4", "", 17, "  ", "gate B"];
const names: string[] = raw.filter(isNonEmptyString);
console.log(names);
console.log(price({ kind: "single", zones: 2 }), price({ kind: "day-pass" }));
console.log(price({ kind: "concession", zones: 2, percentOff: 50 }));
```

```text
[ 'kiosk 4', 'gate B' ]
3 6
1.5
```

3. The call `assertNever(ticket)` is rejected: "Argument of type '{ kind: "day-pass"; }' is not
   assignable to parameter of type 'never'."

## Key takeaways

- `value is T` turns a `boolean` check into a guard the compiler narrows with, in `if` and
  `filter`.
- `asserts value is T` narrows by throwing; declare it with `function`.
- A discriminated union shares a literal tag; `switch` on the tag narrows to one member.
- `assertNever(value: never)` in `default` makes every missing case a compile error.

## Further reading

- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript 3.7 release notes: Assertion functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)
- [TypeScript 5.5 release notes: Inferred type predicates](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html)
