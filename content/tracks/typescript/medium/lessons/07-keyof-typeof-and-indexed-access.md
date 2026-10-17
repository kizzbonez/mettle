---
title: keyof, typeof and Indexed Access
summary: Get the union of an object type's keys with `keyof`, the type of a value with `typeof`, and the type of a property with indexed access `T[K]`; derive types from values instead of writing them twice, and look objects up by a string key without losing safety.
minutes: 30
objectives:
  - Produce the union of an object type's keys with `keyof` and use it as a constraint
  - Use `typeof` in a type position to derive a type from a value
  - Read property and element types with indexed access types such as `T[K]` and `T[number]`
  - Look up an object by a key that arrives as a `string`, with a type guard instead of `any`
---

## Outline

1. Types from types, types from values
2. `keyof`
3. Indexed access types
4. `T[K]` in generic functions
5. `typeof` in type positions
6. Looking up by a string key safely

## Types from types, types from values

Lesson 5 wrote `(typeof Priority)[keyof typeof Priority]` and promised an explanation. That one
line uses three **type operators**, which compute a type from another type or from a value:

- `keyof T`: the keys of an object type, as a union.
- `T[K]`: the type of the property `K` of `T`, an **indexed access type**.
- `typeof x`: the type of the variable `x`, used where a type is expected.

Together they let one definition drive many types.

## `keyof`

`keyof` takes an object type and produces a union of its keys as string literal types:

```ts
interface Bike {
  frame: string;
  gears: number;
  electric: boolean;
}

type BikeField = keyof Bike;

function getField<T, K extends keyof T>(item: T, key: K): T[K] {
  return item[key];
}

const commuter: Bike = { frame: "steel", gears: 8, electric: false };
const gears = getField(commuter, "gears");
const fields: BikeField[] = ["frame", "electric"];
console.log(gears + 1, fields.map((field) => getField(commuter, field)));
```

```text
9 [ 'steel', false ]
```

`BikeField` is `"frame" | "gears" | "electric"`. If someone adds a field to `Bike`, `BikeField`
follows. Two type errors show what the compiler worked out:

```ts
getField(commuter, "colour");
const check: string = gears;
```

```text
main.ts(17,20): error TS2345: Argument of type '"colour"' is not assignable to parameter of type 'keyof Bike'.
main.ts(18,7): error TS2322: Type 'number' is not assignable to type 'string'.
```

The key must be one of `Bike`'s keys, and `gears` is a `number`, not `any`. For a type with an
index signature such as `{ [key: string]: boolean }`, `keyof` is `string | number`, because
JavaScript turns number keys into strings: `obj[0]` and `obj["0"]` are the same property.

## Indexed access types

The syntax you use to read a property, `bike["gears"]`, also works on types. `Bike["gears"]` is
`number`. The index can be a union, giving a union of property types: `Bike["frame" | "gears"]` is
`string | number`, and `Bike[keyof Bike]` is the type of any property. Indexing an array type with
`number` gives its element type, so for `interface Order { lines: { sku: string; qty: number }[] }`
the type of one line is `Order["lines"][number]`. An index that is not a key is an error, as in
`Bike["colour"]`: "Property 'colour' does not exist on type 'Bike'."

Indexed access only takes types. Use the type `"gears"`, not a `const` holding the string.

## `T[K]` in generic functions

Back to `getField<T, K extends keyof T>(item: T, key: K): T[K]`. It has two type parameters, and the
constraint on the second refers to the first: `K` must be one of `T`'s keys. The return type
`T[K]` then links the result to the key passed in. For `getField(commuter, "gears")`, `K` is
`"gears"`, so the result is `Bike["gears"]`, which is `number`. Libraries use this pattern
wherever a function receives an object and the name of one of its properties.

## `typeof` in type positions

JavaScript's `typeof x` is an expression that produces a string such as `"number"` at run time.
TypeScript adds a second meaning: in a position where a type is expected, `typeof x` is the type
the compiler has for the variable `x`. This lets a value define a type, instead of writing both:

```ts
const defaults = {
  host: "localhost",
  port: 8080,
  retries: 3,
};

type Settings = typeof defaults;

function withOverrides(overrides: Partial<Settings>): Settings {
  return { ...defaults, ...overrides };
}

const ROUTES = [
  { path: "/bikes", method: "GET" },
  { path: "/repairs", method: "POST" },
] as const;

type Route = (typeof ROUTES)[number];
type RoutePath = Route["path"];

function describeRoute(route: Route): string {
  return `${route.method} ${route.path}`;
}

const port: Settings["port"] = 9090;
console.log(withOverrides({ port }));
console.log(ROUTES.map(describeRoute));
const path: RoutePath = "/repairs";
console.log(path);
```

```text
{ host: 'localhost', port: 9090, retries: 3 }
[ 'GET /bikes', 'POST /repairs' ]
/repairs
```

`Settings` is `{ host: string; port: number; retries: number }`, written by nobody. `ROUTES` uses
`as const`, so `RoutePath` is the union of the two literal paths. Both are checked:

```text
main.ts(30,17): error TS2322: Type 'string' is not assignable to type 'number'.
main.ts(31,7): error TS2322: Type '"/orders"' is not assignable to type '"/bikes" | "/repairs"'.
```

(Line 30 is `withOverrides({ port: "9090" })`; line 31 assigns `"/orders"` to a `RoutePath`.)
`typeof` in a type works only on names and their properties, such as `typeof defaults.port`, never
on a call: for a function's result use `ReturnType<typeof f>`, as lesson 6 did.

Deriving types from values suits data that *is* the definition, such as defaults, lookup tables
and route lists. For data that comes from elsewhere, write the interface first.

## Looking up by a string key safely

Keys often arrive as plain strings: from a command line, a form, a JSON file. Indexing an object
type with a `string` is refused, and so is the obvious loop:

```ts
const partPrices = {
  chain: 24,
  tyre: 31,
  brakes: 18,
};

function priceOf(part: string): number {
  return partPrices[part];
}

for (const key of Object.keys(partPrices)) {
  console.log(partPrices[key]);
}
```

```text
main.ts(8,10): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ chain: number; tyre: number; brakes: number; }'.
  No index signature with a parameter of type 'string' was found on type '{ chain: number; tyre: number; brakes: number; }'.
main.ts(12,15): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ chain: number; tyre: number; brakes: number; }'.
  No index signature with a parameter of type 'string' was found on type '{ chain: number; tyre: number; brakes: number; }'.
```

The first error is a real bug: `priceOf("bell")` would return `undefined` while claiming `number`.
Why is `Object.keys` a `string[]`? Structural typing: an object with *more* properties may be
assigned to a smaller type (`const point: Point = spot;` compiles when `spot` also has a `label`),
and then `Object.keys(point)` returns `[ 'x', 'y', 'label' ]`.

The fix is a type guard that checks the key at run time, and `Object.entries` for loops:

```ts
type Part = keyof typeof partPrices;

function isPart(name: string): name is Part {
  return Object.hasOwn(partPrices, name);
}

function priceOf(name: string): number | undefined {
  return isPart(name) ? partPrices[name] : undefined;
}

console.log(priceOf("tyre"), priceOf("bell"), priceOf("toString"));
for (const [part, price] of Object.entries(partPrices)) {
  console.log(`${part}: ${price}`);
}
console.log("toString" in partPrices);
```

```text
31 undefined undefined
chain: 24
tyre: 31
brakes: 18
true
```

`Object.hasOwn` checks the object's *own* properties. The last line shows why `in` is the wrong
check here: every object inherits `toString`, so `"toString" in partPrices` is `true`, and
`priceOf("toString")` would have returned a function. When keys are open-ended from the start,
use a `Map`, the subject of the next lesson.

## Common mistakes

- **Silencing TS7053 with a cast**, as in `partPrices[part as keyof typeof partPrices]`. It
  compiles and returns `undefined` for unknown keys. Check the key with a guard.
- **Using `in` to validate keys.** It sees inherited names such as `toString` and `constructor`.
  Use `Object.hasOwn`.
- **Writing `keyof` on a value**: `keyof partPrices` is error TS2749, because `partPrices` is a
  value. Write `keyof typeof partPrices`.
- **Duplicating a type next to its value.** If `defaults` defines the settings, derive
  `Settings` with `typeof` instead of writing it out again.

## Practice

1. From `const SIZES = { small: 250, medium: 350, large: 500 } as const;` derive `Size` (the keys)
   and `Millilitres` (the values).
2. Write `pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][]`.
3. For `interface Order { id: string; lines: { sku: string; qty: number }[] }`, write the type
   `OrderLine` of one line without repeating its fields.

### Answers

```ts
const SIZES = { small: 250, medium: 350, large: 500 } as const;
type Size = keyof typeof SIZES;
type Millilitres = (typeof SIZES)[Size];

function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

interface Order {
  id: string;
  lines: { sku: string; qty: number }[];
}
type OrderLine = Order["lines"][number];

const order: Order = { id: "R-7", lines: [{ sku: "TYRE-28", qty: 2 }, { sku: "CHAIN-9", qty: 1 }] };
const firstLine: OrderLine = order.lines[0];
const size: Size = "medium";
const amount: Millilitres = SIZES[size];
console.log(pluck(order.lines, "sku"), firstLine.qty, amount);
```

```text
[ 'TYRE-28', 'CHAIN-9' ] 2 350
```

`Millilitres` is `250 | 350 | 500`, and `pluck(order.lines, "sku")` is a `string[]`.

## Key takeaways

- `keyof T` is the union of `T`'s keys; `K extends keyof T` limits a parameter to real keys.
- `T[K]` reads a property type; `T[number]` reads an array's element type.
- `typeof x` in a type position derives a type from a value, so the value stays the single
  source of truth.
- A `string` cannot index an object type. Check it with `Object.hasOwn` in a type guard, and loop
  with `Object.entries`.

## Further reading

- [TypeScript Handbook: Keyof type operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [TypeScript Handbook: Typeof type operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
- [TypeScript Handbook: Indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
- [MDN: Object.hasOwn()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)
