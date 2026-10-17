---
title: Overloads and Advanced Function Types
summary: Give one function several call signatures with overloads, declare what this must be, write generic function types and higher-order functions that keep their argument types, and type callbacks the way callers really use them.
minutes: 35
objectives:
  - Write overload signatures with a compatible implementation, and know when a union is better
  - Declare a `this` parameter and read the error for a method called without its object
  - Tell a generic function type from a generic type alias, and write higher-order functions that keep parameter types
  - Type callbacks without optional parameters, and explain why `void` callbacks may return values
---

## Outline

1. Overloads
2. When overloads get in the way
3. `this` parameters
4. Higher-order functions that keep their types
5. Generic function types
6. Typing callbacks

## Overloads

Sometimes the return type depends on which kind of argument is passed. **Overloads** give one
function several **overload signatures**, written without bodies, followed by a single
**implementation** that handles every case:

```ts
interface Member {
  id: number;
  name: string;
}
const members: Member[] = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
];

function lookup(id: number): Member | undefined;
function lookup(ids: readonly number[]): Member[];
function lookup(idOrIds: number | readonly number[]): Member | Member[] | undefined {
  if (typeof idOrIds === "number") return members.find((m) => m.id === idOrIds);
  return members.filter((m) => idOrIds.includes(m.id));
}

const one = lookup(2);
const many = lookup([1, 2, 3]);
console.log(one?.name, many.map((m) => m.name));
```

```text
Grace [ 'Ada', 'Grace' ]
```

Callers see only the two overload signatures, tried from top to bottom: `one` is
`Member | undefined` and `many` is `Member[]`, so `many.map` needs no check. The
**implementation signature** is hidden from callers; it must be compatible with every overload,
and its body is checked against it alone, so the compiler does not verify that the number case
really returns a single member. That is your job.

## When overloads get in the way

Each call must match one overload on its own. A value that might be either kind matches none:

```ts
const wrong: Member = lookup([1]);
function lookupEither(input: number | number[]) {
  return lookup(input);
}
lookup();
```

```text
main.ts(20,7): error TS2739: Type 'Member[]' is missing the following properties from type 'Member': id, name
main.ts(22,17): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Argument of type 'number | number[]' is not assignable to parameter of type 'readonly number[]'.
      Type 'number' is not assignable to type 'readonly number[]'.
main.ts(24,1): error TS2554: Expected 1 arguments, but got 0.
```

The handbook's rule: prefer a parameter with a union type when the return type does not depend
on which member was passed. Use overloads only when it does, and add a last overload taking the
union if callers need it (the first practice exercise).

## `this` parameters

Inside a method, `this` is the object before the dot of the call. A method taken off its object
and called alone gets `undefined`. A **`this` parameter**, a fake first parameter named `this`,
tells the compiler what `this` must be, and it is erased from the output:

```ts
interface Counter {
  count: number;
  increment(this: Counter): number;
}

const counter: Counter = {
  count: 0,
  increment() {
    this.count += 1;
    return this.count;
  },
};

counter.increment();
console.log(counter.increment());
const bound = counter.increment.bind(counter);
console.log(bound());
```

```text
2
3
```

`bind` returns a function whose `this` is fixed. The misuse, appended:

```ts
const detached = counter.increment;
detached();
```

```text
main.ts(19,1): error TS2684: The 'this' context of type 'void' is not assignable to method's 'this' of type 'Counter'.
```

Without the `this` parameter, this call would compile and throw a `TypeError` at run time. Arrow
functions have no `this` of their own: they use the `this` of the code around them, which is why
they are the usual choice for callbacks inside methods.

## Higher-order functions that keep their types

A **higher-order function** takes or returns a function. Wrappers for logging, retrying or
caching should keep the wrapped function's exact parameters. A rest type parameter
`A extends unknown[]` captures the parameter list as a tuple:

```ts
function logged<A extends unknown[], R>(label: string, fn: (...args: A) => R): (...args: A) => R {
  return (...args) => {
    const result = fn(...args);
    console.log(`${label}(${args.join(", ")}) = ${String(result)}`);
    return result;
  };
}

function area(width: number, height: number): number {
  return width * height;
}

const loggedArea = logged("area", area);
const total = loggedArea(3, 4) + loggedArea(2, 5);
console.log(total);

type Picker = <T>(items: readonly T[]) => T | undefined;
const firstItem: Picker = (items) => items[0];
console.log(firstItem([7, 8]), firstItem(["x", "y"]));
```

```text
area(3, 4) = 12
area(2, 5) = 10
22
7 x
```

`A` is inferred as `[width: number, height: number]` and `R` as `number`, so `loggedArea` has the
same signature as `area`. The misuses:

```ts
loggedArea("3", 4);
loggedArea(3);
const letter: number | undefined = firstItem(["x"]);
```

```text
main.ts(20,12): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
main.ts(21,1): error TS2554: Expected 2 arguments, but got 1.
main.ts(22,7): error TS2322: Type 'string | undefined' is not assignable to type 'number | undefined'.
  Type 'string' is not assignable to type 'number'.
```

## Generic function types

Look at where `<T>` sits. `type Picker = <T>(items: readonly T[]) => T | undefined` is a
**generic function type**: the function itself is generic, so each call picks its own `T`, as
`firstItem` did with numbers and then strings. In contrast,
`type PickerOf<T> = (items: readonly T[]) => T | undefined` is a generic *type alias*: you
choose `T` when you name the type, so a `PickerOf<number>` only ever takes numbers. Put the type
parameter on the function when callers should choose.

A function that also has properties is written with a **call signature** in an object type:
`type Formatter = { (value: number): string; unit: string }`.

## Typing callbacks

Two rules make callback types match how callers use them:

```ts
function eachLine(text: string, callback: (line: string, index: number) => void): void {
  text.split("\n").forEach((line, index) => callback(line, index));
}

const seen: string[] = [];
eachLine("alpha\nbeta", (line) => seen.push(line));
eachLine("gamma\ndelta", (line, index) => console.log(index + 1, line));
console.log(seen);
```

```text
1 gamma
2 delta
[ 'alpha', 'beta' ]
```

First, a callback may declare *fewer* parameters than it is given: extra arguments are ignored
in JavaScript. Declaring more is rejected. Second, a callback type returning `void` accepts a
function that returns something (`push` returns a number); the value is ignored. The misuse:

```ts
eachLine("x", (line, index, total) => console.log(line, index, total));
```

```text
main.ts(9,15): error TS2345: Argument of type '(line: any, index: any, total: any) => void' is not assignable to parameter of type '(line: string, index: number) => void'.
  Target signature provides too few arguments. Expected 3 or more, but got 2.
```

## Common mistakes

- **Optional parameters in a callback type.** `(line: string, index?: number) => void` means
  "I may not pass the index", so every callback must handle `undefined`: `index.toFixed(0)` is
  error TS18048, "'index' is possibly 'undefined'." Write `index: number`; callbacks can ignore it.
- **Overloads where a union would do.** They multiply signatures and reject union arguments.
- **Passing a method as a callback.** `setImmediate(counter.increment)` compiles, because the
  callback type does not declare `this`, but the method runs with the wrong `this`. Pass
  `() => counter.increment()` or a bound function.

## Practice

1. Add an overload to `lookup` so that `lookupEither` compiles.
2. Write `once(fn)`, which calls `fn` the first time and afterwards returns the first result,
   keeping `fn`'s parameter types.

### Answers

```ts
function lookup(id: number): Member | undefined;
function lookup(ids: readonly number[]): Member[];
function lookup(idOrIds: number | readonly number[]): Member | Member[] | undefined;
function lookup(idOrIds: number | readonly number[]): Member | Member[] | undefined {
  if (typeof idOrIds === "number") return members.find((m) => m.id === idOrIds);
  return members.filter((m) => idOrIds.includes(m.id));
}
function lookupEither(input: number | number[]) {
  return lookup(input);
}

function once<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  let done = false;
  let result: R;
  return (...args) => {
    if (!done) {
      result = fn(...args);
      done = true;
    }
    return result;
  };
}

const connect = once((host: string) => {
  console.log(`connecting to ${host}`);
  return host.length;
});
console.log(connect("db.local"), connect("other"));
console.log(lookupEither(2));
```

```text
connecting to db.local
8 8
{ id: 2, name: 'Grace' }
```

With `Member` and `members` as in the first example, this runs. The third signature is the last
overload, so a `number | number[]` argument now matches it.
`connect(42)` is rejected: "Argument of type 'number' is not assignable to parameter of type
'string'."

## Key takeaways

- Overload signatures are what callers see; the implementation must cover them all.
- A union argument matches no single overload: prefer union parameters when you can.
- A `this` parameter makes "called without its object" a compile error.
- `A extends unknown[]` with `...args: A` lets wrappers keep exact parameter lists.
- Callbacks may take fewer parameters than given, and `void` callbacks may return values.

## Further reading

- [TypeScript Handbook: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [TypeScript Handbook: Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
