---
title: Enums, Literal Unions and as const
summary: See what numeric and string enums compile to, why projects that run TypeScript with Node's type stripping or `erasableSyntaxOnly` avoid them, and replace them with unions of literals and `as const` objects and arrays whose types are derived with `typeof` and `keyof typeof`.
minutes: 30
objectives:
  - Declare numeric and string enums and describe the JavaScript the compiler emits for them
  - Explain why Node's type stripping and `erasableSyntaxOnly` reject enums
  - Use a union of string literals with an `as const` array for runtime checks
  - Replace an enum with an `as const` object and derive its value and key types
---

## Outline

1. A fixed set of values
2. Numeric and string enums
3. Enums are code, not just types
4. Unions of literals
5. `as const` arrays
6. `as const` objects as enum replacements
7. Choosing

## A fixed set of values

A priority is low, normal or urgent; a message goes by email, SMS or push. Plain `string` or
`number` would accept anything, so TypeScript offers two ways to name such a set: the **enum**,
and a union of **literal types** from the basic level. Current code mostly prefers the second.

## Numeric and string enums

An `enum` declares a named set of constants. In a **numeric enum**, members count up from 0 unless
you give values. In a **string enum**, every member needs a string value:

```ts
enum Priority {
  Low,
  Normal,
  Urgent,
}

enum Channel {
  Email = "email",
  Sms = "sms",
}

const ticket = { title: "Boiler leaking", priority: Priority.Urgent, channel: Channel.Sms };
console.log(ticket);
console.log(Priority[2], Priority.Low, Channel.Email);
console.log(Object.keys(Priority));
```

```text
{ title: 'Boiler leaking', priority: 2, channel: 'sms' }
Urgent 0 email
[ '0', '1', '2', 'Low', 'Normal', 'Urgent' ]
```

Two surprises are already visible. The stored priority is the bare number `2`, which means
nothing in a log or a database. And `Priority[2]` is `"Urgent"`: numeric enums also map values
back to names, so `Object.keys` lists six keys for three members. Numeric enums are also loose
about which numbers they accept. Add this below the two enums:

```ts
function notify(channel: Channel): string {
  return `sending by ${channel}`;
}

const fromForm: number = 7;
const priority: Priority = fromForm;
console.log(priority, notify(Channel.Sms));
console.log(notify("sms"));
```

```text
main.ts(19,20): error TS2345: Argument of type '"sms"' is not assignable to parameter of type 'Channel'.
```

Any `number` variable may be assigned to `Priority` (only a literal like `7` is refused), so
without the last line the program prints `7 sending by sms`. String enums are the opposite: they
are strict to the point that the very string `"sms"` is not accepted where `Channel` is expected,
even though `Channel.Sms` is `"sms"` at run time.

## Enums are code, not just types

Most TypeScript syntax disappears when compiled. An enum does not; it becomes a JavaScript object
built by generated code. This is what `tsc` emits for the two enums above:

```js
var Priority;
(function (Priority) {
    Priority[Priority["Low"] = 0] = "Low";
    Priority[Priority["Normal"] = 1] = "Normal";
    Priority[Priority["Urgent"] = 2] = "Urgent";
})(Priority || (Priority = {}));
var Channel;
(function (Channel) {
    Channel["Email"] = "email";
    Channel["Sms"] = "sms";
})(Channel || (Channel = {}));
```

That matters more every year, because more code is run *without* `tsc` writing the JavaScript.
Node.js runs `.ts` files by **type stripping**: it deletes the type syntax and runs what is left,
and it never generates code. So `node main.ts` refuses the enum:

```text
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

Projects that run this way, or that use similar tools, turn on the compiler option
`"erasableSyntaxOnly": true` (TypeScript 5.8), which reports every construct that cannot simply be
erased: enums, namespaces with code, and parameter properties.

```text
main.ts(1,6): error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
main.ts(7,6): error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
```

`const enum`, which `tsc` inlines, has the same problem. The handbook itself suggests plain objects
as the alternative, because they keep code aligned with JavaScript.

## Unions of literals

A union of string literals names the set with no runtime code at all:
`type Channel = "email" | "sms" | "push";`. Values are ordinary strings, so they read well in logs
and JSON, a `switch` over them narrows, and a typo is caught. What a type cannot do is exist at
run time: you cannot loop over a type or check user input against it. For that, keep the values
in an array and derive the type from the array.

## `as const` arrays

`as const` after a literal asks for the narrowest type: every string becomes its literal type,
and arrays and objects become `readonly`. Then `typeof` in a type position reads a variable's
type, and indexing that type with `[number]` gives the union of the element types:

```ts
const CHANNELS = ["email", "sms", "push"] as const;
type Channel = (typeof CHANNELS)[number];

function isChannel(value: string): value is Channel {
  return (CHANNELS as readonly string[]).includes(value);
}

function notify(channel: Channel): string {
  return `sending by ${channel}`;
}

console.log(notify("sms"));
for (const input of ["push", "fax"]) {
  console.log(input, isChannel(input) ? notify(input) : "unknown channel");
}
console.log(CHANNELS.length);
```

```text
sending by sms
push sending by push
fax unknown channel
3
```

`CHANNELS` is the single source of truth: add `"webhook"` to the array and the type follows. The
widening `as readonly string[]` is needed because `includes` on a tuple of literals only accepts
those literals, and we are asking about any string. The compiler still guards the rest:

```text
main.ts(17,8): error TS2345: Argument of type '"fax"' is not assignable to parameter of type '"email" | "push" | "sms"'.
main.ts(18,10): error TS2339: Property 'push' does not exist on type 'readonly ["email", "sms", "push"]'.
```

The first line is `notify("fax")`, the second `CHANNELS.push("pigeon")`: the array is read-only.

## `as const` objects as enum replacements

When you want enum-style names such as `Priority.Urgent`, use an `as const` object, and derive
two types from it with `keyof`, which gives the union of an object type's keys (lesson 7 covers it
in depth):

```ts
const Priority = {
  Low: 1,
  Normal: 2,
  Urgent: 3,
} as const;

type Priority = (typeof Priority)[keyof typeof Priority];
type PriorityName = keyof typeof Priority;

function label(priority: Priority): string {
  switch (priority) {
    case Priority.Low:
      return "whenever";
    case Priority.Normal:
      return "this week";
    case Priority.Urgent:
      return "today";
  }
}

const name: PriorityName = "Urgent";
console.log(label(Priority[name]), label(2));
console.log(Object.keys(Priority), Object.values(Priority));
```

```text
today this week
[ 'Low', 'Normal', 'Urgent' ] [ 1, 2, 3 ]
```

Read `(typeof Priority)[keyof typeof Priority]` from the inside: `typeof Priority` is the object's
type, `keyof` of it is `"Low" | "Normal" | "Urgent"`, and indexing with those keys gives the value
types, `1 | 2 | 3`. A value and a type may share the name `Priority`, because TypeScript keeps
values and types apart. Callers can write `Priority.Urgent` or plain `3`, but `label(7)` is error
TS2345, and `Priority.Low = 0` is error TS2540, "Cannot assign to 'Low' because it is a read-only
property". The compiled JavaScript is the object as written, so `node main.ts` runs it unchanged.

Leave out `as const` and the members widen to `number`, so the type `Priority` is plain `number`.
Three cases can no longer cover every number, and the compiler says so:

```text
main.ts(10,37): error TS2366: Function lacks ending return statement and return type does not include 'undefined'.
```

## Choosing

Use a union of string literals for most sets, adding an `as const` array when you need the values
at run time. Use an `as const` object when names and values differ. Enums still work under `tsc`
and you will meet them in older code and libraries, so read them fluently, but they are not
erasable, and new projects that run TypeScript directly cannot use them.

## Common mistakes

- **Forgetting `as const`**: the types widen to `string` or `number` and the union is lost.
- **Expecting a type at run time**: `type Channel = "email" | "sms"` cannot be looped over. Keep an
  `as const` array.
- **Storing numeric enum values**: a database full of `2` is unreadable and breaks if members are
  reordered. Prefer string values.
- **Forgetting `typeof`**: `type Channel = CHANNELS[number]` is error TS2749, "'CHANNELS' refers
  to a value, but is being used as a type here. Did you mean 'typeof CHANNELS'?"

## Practice

1. Replace `enum Size { Small = "S", Medium = "M", Large = "L" }` with an `as const` object and a
   type `Size`, and write `price(size: Size)`: 2.2, 2.8 and 3.3.
2. Write `isSize(value: string): value is Size` using `Object.values`.
3. What does `enum Level { A = 1, B, C }` make `Level[3]` and `Level.B`?

### Answers

```ts
const Size = {
  Small: "S",
  Medium: "M",
  Large: "L",
} as const;

type Size = (typeof Size)[keyof typeof Size];

const SIZE_VALUES: readonly string[] = Object.values(Size);

function isSize(value: string): value is Size {
  return SIZE_VALUES.includes(value);
}

function price(size: Size): number {
  switch (size) {
    case Size.Small:
      return 2.2;
    case Size.Medium:
      return 2.8;
    case Size.Large:
      return 3.3;
  }
}

for (const input of ["M", "XL"]) {
  console.log(input, isSize(input) ? price(input) : "no such size");
}
console.log(price(Size.Large), price("S"));
```

```text
M 2.8
XL no such size
3.3 2.2
```

3. Counting continues from 1, so `B` is 2 and `C` is 3, and the reverse mapping makes `Level[3]`
   the string `"C"`.

## Key takeaways

- Enums compile to objects built by generated code; numeric enums add a reverse mapping and accept
  any `number`.
- Type stripping and `erasableSyntaxOnly` reject enums because they cannot simply be erased.
- `as const` keeps literal types and makes arrays and objects read-only.
- `(typeof ARRAY)[number]` and `(typeof OBJ)[keyof typeof OBJ]` derive a union from values, so the
  values stay the single source of truth.

## Further reading

- [TypeScript Handbook: Enums, including "Objects vs Enums"](https://www.typescriptlang.org/docs/handbook/enums.html)
- [TypeScript 5.8 release notes: `--erasableSyntaxOnly`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html)
- [Node.js 26: Modules, TypeScript (type stripping)](https://nodejs.org/docs/latest-v26.x/api/typescript.html)
