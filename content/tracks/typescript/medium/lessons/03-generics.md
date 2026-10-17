---
title: Generics
summary: Write functions, interfaces, type aliases and classes that work for many types without giving up type safety, limit type parameters with `extends` constraints, give them defaults, and let inference choose them for you.
minutes: 35
objectives:
  - Explain what a type parameter is and why `T` beats `any` for reusable code
  - Write generic functions, interfaces, type aliases and classes, and pass type arguments when inference cannot
  - Constrain a type parameter with `extends` and read the errors constraints produce
  - Apply the handbook's guidelines so that generic signatures stay simple
---

## Outline

1. The problem with `any`
2. A first generic function
3. Several type parameters and explicit type arguments
4. Generic interfaces, type aliases and classes
5. Constraints with `extends`
6. Defaults and good generic style

## The problem with `any`

Suppose you want a function that returns the first element of any array. With the tools so far,
the only type that accepts every array is `any[]`, and the result is `any`:

```ts
function firstAny(items: any[]): any {
  return items[0];
}

const crops = ["kale", "leek", "chard"];
const loose = firstAny(crops);
console.log(loose.toFixed(1));
```

```text
TypeError: loose.toFixed is not a function
```

It compiled, then crashed. `any` switches checking off, so the compiler forgot that the array
held strings. What we want is a way to say "the function returns *the same type* the array
holds, whatever that is".

## A first generic function

A **type parameter** is a placeholder for a type, written in angle brackets after the function
name. Its name is often `T`, for type. Each call fills it with a real type, the **type argument**:

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const crops = ["kale", "leek", "chard"];
const typed = first(crops);
console.log(typed?.toUpperCase());
console.log(first([3, 1, 2]));
```

```text
KALE
3
```

For `first(crops)`, the compiler sees a `string[]` argument, so `T` is `string` and `typed` is
`string | undefined`. This is **inference**: you did not write `first<string>`. The second call
makes `T` `number`. Add these two lines as lines 9 and 10: the same mistake as before is now
caught, and each type error also reveals what was inferred (your editor shows the same when you
hover over a name):

```ts
console.log(typed.toFixed(1));
const check: boolean = first([3, 1, 2]);
```

```text
main.ts(9,13): error TS18048: 'typed' is possibly 'undefined'.
main.ts(9,19): error TS2551: Property 'toFixed' does not exist on type 'string'. Did you mean 'fixed'?
main.ts(10,7): error TS2322: Type 'number | undefined' is not assignable to type 'boolean'.
  Type 'undefined' is not assignable to type 'boolean'.
```

The return type says `T | undefined` because an empty array has no first element. A generic
function is honest about edge cases like any other.

## Several type parameters and explicit type arguments

A function can have more than one type parameter when it relates more than two things. Here
`mapAll` turns items of one type into results of another:

```ts
function mapAll<In, Out>(items: readonly In[], convert: (item: In) => Out): Out[] {
  const results: Out[] = [];
  for (const item of items) {
    results.push(convert(item));
  }
  return results;
}

function combine<T>(left: T[], right: T[]): T[] {
  return [...left, ...right];
}

const lengths = mapAll(["kale", "leek", "chard"], (crop) => crop.length);
console.log(lengths);
console.log(combine<string | number>([1, 2], ["three"]));
```

```text
[ 4, 4, 5 ]
[ 1, 2, 'three' ]
```

Both type parameters of `mapAll` were inferred: `In` from the array (`string`), `Out` from what
the arrow function returns (`number`). The callback's parameter `crop` needed no annotation,
because `In` was already known.

Inference sometimes picks a type you did not intend. Called as `combine([1, 2], ["three"])`,
`T` is inferred as `number` from the first argument, and the second is rejected:

```text
main.ts(5,30): error TS2322: Type 'string' is not assignable to type 'number'.
```

If mixing really is intended, pass the type argument yourself, as in `combine<string | number>`.

## Generic interfaces, type aliases and classes

Types can take parameters too. A generic interface or type alias is a pattern you fill in when you
use it, and a generic class has a type parameter for the whole class:

```ts
interface Page<T> {
  items: T[];
  next: number | null;
}

type Pair<A, B = A> = [A, B];

class Queue<T> {
  #items: T[] = [];

  enqueue(item: T): void {
    this.#items.push(item);
  }

  dequeue(): T | undefined {
    return this.#items.shift();
  }

  get size(): number {
    return this.#items.length;
  }
}

const page: Page<string> = { items: ["kale", "leek"], next: 2 };
const range: Pair<number> = [10, 20];
const labelled: Pair<string, number> = ["beds", 12];

const orders = new Queue<string>();
orders.enqueue("seed potatoes");
orders.enqueue("onion sets");
console.log(orders.dequeue(), orders.size);
console.log(page.items.length, range, labelled);
```

```text
seed potatoes 1
2 [ 10, 20 ] [ 'beds', 12 ]
```

You have used generic types since the basic level: `Array<string>` is the long form of
`string[]`. `Queue<string>` accepts only strings, so `orders.enqueue(42)` is error TS2345,
"Argument of type 'number' is not assignable to parameter of type 'string'." Type parameters
belong to instances: a `static` member of `Queue` cannot use `T`.

## Constraints with `extends`

Inside a generic function, `T` could be anything, so you can only do with it what works for every
type. Try to read `.length`:

```ts
function longest<T>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
```

```text
main.ts(2,12): error TS2339: Property 'length' does not exist on type 'T'.
main.ts(2,24): error TS2339: Property 'length' does not exist on type 'T'.
```

A **constraint**, `T extends Something`, limits which types `T` may be, and in exchange lets you
use what `Something` guarantees:

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

interface Plot {
  id: string;
  crop: string;
}

function findById<T extends { id: string }>(items: readonly T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

const plots: Plot[] = [
  { id: "A1", crop: "kale" },
  { id: "B4", crop: "chard" },
];
console.log(longest("leek", "chard"));
console.log(longest([1, 2, 3], [4]));
console.log(findById(plots, "B4")?.crop);
```

```text
chard
[ 1, 2, 3 ]
chard
```

Strings and arrays both have a numeric `length`, so both are accepted; `longest(10, 100)` is
refused with "Argument of type 'number' is not assignable to parameter of type '{ length:
number; }'". `findById` shows why constraints beat plain parameter types: it only needs `id`, yet
it returns the full `Plot`, so `.crop` is available on the result.

## Defaults and good generic style

`type Pair<A, B = A>` above gives `B` a **default**: `Pair<number>` means `Pair<number, number>`.
Parameters with defaults must come after those without.

The handbook adds three rules of thumb. Use the type parameter itself rather than constraining it
when you can (`items: T[]` rather than `T extends any[]`). Use as few type parameters as possible.
And a type parameter should appear at least twice, because its job is to relate two things:
`function greet<S extends string>(name: S): void` relates nothing and is better as
`greet(name: string)`. Finally, let inference work: write type arguments only when the compiler
cannot work them out or picks the wrong one.

## Common mistakes

- **Reaching for `any`** when the type varies. Use a type parameter.
- **Returning "something like T"** instead of T itself:

  ```ts
  function padded<T extends { length: number }>(value: T, minimum: number): T {
    if (value.length >= minimum) {
      return value;
    }
    return { length: minimum };
  }
  ```

  ```text
  main.ts(9,3): error TS2322: Type '{ length: number; }' is not assignable to type 'T'.
    '{ length: number; }' is assignable to the constraint of type 'T', but 'T' could be instantiated with a different subtype of constraint '{ length: number; }'.
  ```

  The caller might pass an array and expect an array back. Return `value`, or change the return
  type to `{ length: number }`.
- **Writing type arguments everywhere**, as in `first<string>(crops)`. It adds noise and nothing
  else.

## Practice

1. Write `last<T>(items: readonly T[]): T | undefined`.
2. Write `maxBy<T>(items, score)` that returns the item with the highest `score(item)`, or
   `undefined` for an empty array.
3. Write a generic class `Stack<T>` with `push`, `pop` and `peek`.

### Answers

```ts
function last<T>(items: readonly T[]): T | undefined {
  return items.at(-1);
}

function maxBy<T>(items: readonly T[], score: (item: T) => number): T | undefined {
  let best: T | undefined;
  let bestScore = -Infinity;
  for (const item of items) {
    const itemScore = score(item);
    if (itemScore > bestScore) {
      best = item;
      bestScore = itemScore;
    }
  }
  return best;
}

class Stack<T> {
  #items: T[] = [];

  push(item: T): void {
    this.#items.push(item);
  }

  pop(): T | undefined {
    return this.#items.pop();
  }

  peek(): T | undefined {
    return this.#items.at(-1);
  }
}

const harvest = [
  { crop: "kale", kilos: 12 },
  { crop: "squash", kilos: 31 },
];
const trays = new Stack<number>();
trays.push(1);
trays.push(2);
console.log(last(["a", "b", "c"]), last([]));
console.log(maxBy(harvest, (row) => row.kilos)?.crop);
console.log(trays.pop(), trays.peek());
```

```text
c undefined
squash
2 1
```

## Key takeaways

- A type parameter `<T>` links the types of inputs and outputs; each call fills it in, usually
  by inference.
- Interfaces, type aliases and classes can be generic: `Page<T>`, `Pair<A, B = A>`, `Queue<T>`.
- `T extends C` constrains `T` so you can use what `C` promises, while still returning the
  caller's exact type.
- Keep generic signatures small: few type parameters, each used at least twice.

## Further reading

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook: More on Functions, generic functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#generic-functions)
