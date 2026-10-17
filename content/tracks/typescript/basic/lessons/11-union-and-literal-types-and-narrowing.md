---
title: Union and Literal Types and Narrowing
summary: Describe values that can be one of several types with unions, restrict them to exact values with literal types, and narrow them safely with typeof, equality, in, instanceof and Array.isArray, ending with a first look at discriminated unions.
minutes: 35
objectives:
  - Write union types and explain which operations the compiler allows on them
  - Use literal types and unions of literals, and explain why `let` widens a literal to `string`
  - Narrow unions with `typeof`, equality, `in`, `instanceof` and `Array.isArray`
  - Model alternatives with a discriminated union and narrow it with `switch`
---

## Outline

1. Union types
2. Narrowing with `typeof`
3. Literal types
4. Narrowing text into a literal union
5. Narrowing with `in`, `instanceof` and `Array.isArray`
6. A first look at discriminated unions

## Union types

A **union type** `A | B` describes a value that is either an `A` or a `B`. You have already met
`string | undefined` and `string | null`; any types can be combined. An order number might be
given as a number or as text:

```ts
function formatId(id: number | string): string {
  return id.toUpperCase();
}
```

```text
main.ts(2,13): error TS2339: Property 'toUpperCase' does not exist on type 'string | number'.
  Property 'toUpperCase' does not exist on type 'number'.
```

On a union, the compiler only allows what is valid for **every** member. Numbers have no
`toUpperCase`, so the call is refused. To do something that only one member allows, you must first
find out which member you have.

## Narrowing with `typeof`

Checking a value's kind with a test the compiler understands is called **narrowing**: inside the
branch, the type is narrower than the union. `typeof` is the test for primitives:

```ts
function formatId(id: number | string): string {
  if (typeof id === "number") {
    return `#${String(id).padStart(5, "0")}`;
  }
  return id.toUpperCase();
}

console.log(formatId(42), formatId("ab-7"));
```

```text
#00042 AB-7
```

Inside the `if`, `id` is a `number`. The `if` returns, so after it the compiler knows `id` can only
be a `string`. This tracking of what each path has ruled out is called **control flow analysis**,
and it is what made the `undefined` checks of lesson 10 work.

## Literal types

A **literal type** is a type with exactly one value: `"S"` is the type whose only value is the
string `"S"`. On their own they are rarely useful, but a union of literals lists every allowed
value, which is much more precise than `string`:

```ts
type Size = "S" | "M" | "L";

function priceOf(size: Size): number {
  switch (size) {
    case "S":
      return 3;
    case "M":
      return 4;
    case "L":
      return 5;
  }
}

console.log(priceOf("M"));
console.log(priceOf("XL"));
let chosen = "M";
console.log(priceOf(chosen));
```

```text
main.ts(15,21): error TS2345: Argument of type '"XL"' is not assignable to parameter of type 'Size'.
main.ts(17,21): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Size'.
```

The first error is the point of literal types: a misspelled or unsupported size never reaches
the running program. The `switch` needs no final `return`, because the compiler sees that the three
cases cover every possible `Size`.

The second error is about **widening**. `let chosen = "M"` could later hold any string, so the
compiler infers `string`, not `"M"`. A `const` can never change, so `const fixed = "L";` gets the
literal type `"L"`, and `priceOf(fixed)` compiles. You can also annotate:
`let picked: Size = "S";`. This is also why comparing two different constant strings was an error
in lesson 4: their literal types have no value in common.

Numbers and booleans have literal types too: `type Dice = 1 | 2 | 3 | 4 | 5 | 6;`, and `boolean`
is the union `true | false`.

## Narrowing text into a literal union

Input arrives as `string`. Checking it against each allowed value with `===` narrows it to the
union, so you can return it with the precise type:

```ts
type Size = "S" | "M" | "L";

function parseSize(text: string): Size | undefined {
  const upper = text.trim().toUpperCase();
  if (upper === "S" || upper === "M" || upper === "L") {
    return upper;
  }
  return undefined;
}

console.log(parseSize(" m "), parseSize("xl"));
```

```text
M undefined
```

Inside the `if`, `upper` has the type `"S" | "M" | "L"`. If one of the comparisons were wrong, say
`upper === "XL"`, the return would fail to compile:

```text
main.ts(6,5): error TS2322: Type '"M" | "S" | "XL"' is not assignable to type 'Size | undefined'.
  Type '"XL"' is not assignable to type 'Size | undefined'.
```

This is the pattern for validating input: take a `string`, check it, and return either a value of
the precise type or `undefined` (or an error, lesson 12) for the caller to handle.

## Narrowing with `in`, `instanceof` and `Array.isArray`

`typeof` cannot tell one kind of object from another; it says `"object"` for all of them, and for
`null`. Three other tests can:

```ts
interface Email {
  address: string;
}

interface Phone {
  number: string;
  extension?: string;
}

function contactLine(contact: Email | Phone): string {
  if ("address" in contact) {
    return `mail ${contact.address}`;
  }
  return `call ${contact.number}`;
}

function dayOf(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}

function joinTags(tags: string | string[]): string {
  return Array.isArray(tags) ? tags.join(", ") : tags;
}

console.log(contactLine({ address: "ada@example.com" }), "|", contactLine({ number: "555-0100" }));
console.log(dayOf(new Date("2026-10-17T09:30:00Z")), "|", dayOf("tomorrow"));
console.log(joinTags(["red", "wool"]), "|", joinTags("cotton"));
```

```text
mail ada@example.com | call 555-0100
2026-10-17 | tomorrow
red, wool | cotton
```

- `"address" in contact` is true when the object has that property, which narrows to the members
  that declare it.
- `value instanceof Date` is true for objects created with `new Date(...)`, JavaScript's built-in
  date type. `instanceof` works for any class, including the error classes of lesson 12.
- `Array.isArray(tags)` is true for arrays. Narrowing works in the conditional operator as well as
  in `if`.

## A first look at discriminated unions

The best way to model "one of several kinds of thing" is a union of object types that share a
property with a different literal type in each. That property is the **discriminant**, and
checking it narrows the whole object:

```ts
type Delivery =
  | { kind: "pickup"; store: string }
  | { kind: "courier"; address: string; express: boolean };

function summary(delivery: Delivery): string {
  switch (delivery.kind) {
    case "pickup":
      return `Collect at ${delivery.store}`;
    case "courier":
      return `${delivery.express ? "Express" : "Standard"} to ${delivery.address}`;
  }
}

console.log(summary({ kind: "pickup", store: "Harbour St" }));
console.log(summary({ kind: "courier", address: "4 Elm Row", express: true }));
```

```text
Collect at Harbour St
Express to 4 Elm Row
```

In the `"courier"` case, `delivery` has exactly the courier properties. Reading
`delivery.address` before narrowing is refused, because a pickup has no address:

```text
main.ts(6,19): error TS2339: Property 'address' does not exist on type 'Delivery'.
  Property 'address' does not exist on type '{ kind: "pickup"; store: string; }'.
```

A pickup with an address, or a courier without one, cannot even be written. The medium level
returns to discriminated unions and shows how to make the compiler check that every kind is
handled.

## Common mistakes

- **A `let` where a literal type is needed.** `let chosen = "M"; priceOf(chosen);` is TS2345,
  because `chosen` is a `string`. Use `const` or annotate `let chosen: Size`.
- **A misspelled case.** `case "pikup":` in the `switch` above is
  `error TS2678: Type '"pikup"' is not comparable to type '"courier" | "pickup"'.`
- **Narrowing a number by truthiness.** `if (count)` with `count: number | undefined` also rejects
  0, so `describe(0)` would print `unknown`. Test `count !== undefined`.
- **`typeof x === "object"` to rule out `null`.** For `tags: string[] | null`, using `tags` inside
  that check is `error TS18047: 'tags' is possibly 'null'.` Test `tags !== null`.

## Practice

1. Define `type Coin = "heads" | "tails"` and write `flip(previous: Coin): Coin` that returns the
   other side.
2. Write `total(value: number | number[]): number` that adds up an array or returns a single
   number.
3. Write `parseAnswer(text: string): "yes" | "no" | undefined` that accepts `y`, `yes`, `n` and
   `no` in any case, with spaces around them.

### Answers

```ts
type Coin = "heads" | "tails";

function flip(previous: Coin): Coin {
  return previous === "heads" ? "tails" : "heads";
}

function total(value: number | number[]): number {
  if (Array.isArray(value)) {
    return value.reduce((sum, n) => sum + n, 0);
  }
  return value;
}

function parseAnswer(text: string): "yes" | "no" | undefined {
  const word = text.trim().toLowerCase();
  if (word === "y" || word === "yes") {
    return "yes";
  }
  if (word === "n" || word === "no") {
    return "no";
  }
  return undefined;
}

console.log(flip("heads"), total(7), total([1, 2, 3]), parseAnswer(" Y "), parseAnswer("No"), parseAnswer("maybe"));
```

```text
tails 7 6 yes no undefined
```

## Key takeaways

- `A | B` is a value of either type; only operations valid for every member are allowed.
- Literal types such as `"S"` allow one value; unions of them list every allowed value. `let`
  widens literals to `string`, `const` keeps them.
- `typeof`, `===`, `in`, `instanceof` and `Array.isArray` narrow a union inside the branch that
  checked it, and control flow analysis carries the result forward.
- Validate input by narrowing a `string` to a literal union with `===`.
- A discriminated union shares a literal `kind` property; a `switch` on it narrows the whole
  object.

## Further reading

- [TypeScript handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript handbook: Everyday Types, union and literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [MDN: instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
