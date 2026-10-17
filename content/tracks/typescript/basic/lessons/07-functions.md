---
title: Functions
summary: Package code into functions with typed parameters and return values, write arrow functions, use optional, default and rest parameters, pass functions as values with function types, meet void and never, and understand closures and recursion.
minutes: 35
objectives:
  - Declare functions and arrow functions with parameter and return types, and read the errors for wrong calls
  - Use optional, default and rest parameters
  - Write a function type and pass a function as an argument
  - Explain `void` and `never`, closures and recursion with a base case
---

## Outline

1. Declaring and calling a function
2. Every path must return
3. Arrow functions
4. Optional, default and rest parameters
5. Functions as values and function types
6. `void` and `never`
7. Closures
8. Recursion

## Declaring and calling a function

A **function** is a named block of code that does one job. You **call** it with values, and it can
give a value back. Write the job once and use it as often as you like:

```ts
function flourFor(loaves: number, gramsPerLoaf: number): number {
  return loaves * gramsPerLoaf;
}

console.log(flourFor(3, 500));
const total = flourFor(2, 450) + flourFor(1, 600);
console.log(total);
```

```text
1500
1500
```

`loaves` and `gramsPerLoaf` are **parameters**: names that receive the values a caller passes,
which are called **arguments**. Each parameter needs a type annotation; without one, strict mode
reports `error TS7006: Parameter 'n' implicitly has an 'any' type.` The `: number` after the
parentheses is the **return type**. `return` ends the function and hands its value to the caller,
so `flourFor(2, 450)` becomes 900 where it is written.

Every call is checked against the parameters, in number and in type:

```ts
console.log(flourFor(3));
console.log(flourFor("3", 500));
```

```text
main.ts(5,13): error TS2554: Expected 2 arguments, but got 1.
main.ts(6,22): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

The compiler could infer the return type, but writing it states your intent and catches a
`return` of the wrong type inside the function. This course writes return types on every function
that other files use.

## Every path must return

A function that promises a `number` must return one on every path through its code:

```ts
function ovenSetting(bread: string): number {
  if (bread === "rye") {
    return 230;
  } else if (bread === "white") {
    return 220;
  }
}
```

```text
main.ts(1,38): error TS2366: Function lacks ending return statement and return type does not include 'undefined'.
```

For any other bread, the function would reach its end and return nothing. Decide what that case
means and handle it, as the `never` section below does.

## Arrow functions

An **arrow function** is a shorter way to write a function as a value, usually stored in a
`const`:

```ts
const toFahrenheit = (celsius: number): number => celsius * 9 / 5 + 32;
const describe = (name: string, minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  return `${name}: ${hours} h ${minutes % 60} min`;
};
console.log(toFahrenheit(220));
console.log(describe("Sourdough", 135));
```

```text
428
Sourdough: 2 h 15 min
```

When the body after `=>` is a single expression, that expression is returned without the word
`return`. With braces, the body is a block and needs `return`. Arrow functions are the usual
choice for short functions passed to other functions; declarations suit the main named steps of a
program.

## Optional, default and rest parameters

```ts
function label(name: string, grams = 800, note?: string): string {
  const base = `${name} (${grams} g)`;
  if (note === undefined) {
    return base;
  }
  return `${base}, ${note}`;
}

function totalWeight(...weights: number[]): number {
  let sum = 0;
  for (const weight of weights) {
    sum += weight;
  }
  return sum;
}

console.log(label("Rye"));
console.log(label("Rye", 1000));
console.log(label("Rye", 1000, "seeded"));
console.log(label("Rye", undefined, "seeded"));
console.log(totalWeight(800, 1000, 450), totalWeight());
```

```text
Rye (800 g)
Rye (1000 g)
Rye (1000 g), seeded
Rye (800 g), seeded
2250 0
```

- A **default value** (`grams = 800`) is used when the argument is left out or is `undefined`. The
  type is inferred from it.
- An **optional parameter** (`note?: string`) may be left out. Inside the function its type is
  `string | undefined`, read "string or undefined", so you must check before using it as a string:
  `note.toUpperCase()` without the check is `error TS18048: 'note' is possibly 'undefined'.`
  Lesson 10 covers this in depth.
- A **rest parameter** (`...weights: number[]`) collects any number of arguments into an array
  (lesson 8), which may be empty.

Optional and default parameters come after the required ones, and the rest parameter comes last.

## Functions as values and function types

A function is a value like any other: it can be stored in a variable and passed to another
function. Its type is written like an arrow function: `(n: number) => number` means "takes a
number, returns a number":

```ts
function applyTwice(value: number, step: (n: number) => number): number {
  return step(step(value));
}

const double = (n: number): number => n * 2;
console.log(applyTwice(5, double));
console.log(applyTwice(5, (n) => n + 10));
```

```text
20
25
```

`double` is passed without parentheses: the function itself, not the result of calling it. In
the second call, `n` has no annotation, yet it is a `number`: the compiler takes the type from the
parameter it is passed to, which is called **contextual typing**. A function of the wrong shape is
rejected, with the reason indented below the error:

```text
main.ts(5,27): error TS2345: Argument of type '(text: string) => number' is not assignable to parameter of type '(n: number) => number'.
  Types of parameters 'text' and 'n' are incompatible.
    Type 'number' is not assignable to type 'string'.
```

## `void` and `never`

`void` is the return type of a function that returns no value and is called only for what it does,
such as printing. `never` is the return type of a function that never returns at all, because it
always stops the program with an error. `throw` does that; lesson 12 covers it:

```ts
function announce(message: string): void {
  console.log(`>> ${message}`);
}

function fail(message: string): never {
  throw new Error(message);
}

function ovenSetting(bread: string): number {
  if (bread === "rye") {
    return 230;
  }
  if (bread === "white") {
    return 220;
  }
  return fail(`Unknown bread: ${bread}`);
}

announce(`Rye bakes at ${ovenSetting("rye")} degrees`);
announce(`Spelt bakes at ${ovenSetting("spelt")} degrees`);
```

```text
>> Rye bakes at 230 degrees
/tmp/work/main.ts:6
  throw new Error(message);
        ^

Error: Unknown bread: spelt
```

(The stack trace after the last line is cut here.) Because `fail` returns `never`, the compiler
accepts `return fail(...)` in a function that returns `number`: that line can never produce a
value of the wrong type.

## Closures

A function can use variables from the code around it, and keeps them alive even after that code
has finished. The function together with the variables it captured is a **closure**:

```ts
function makeCounter(): () => number {
  let count = 0;
  return () => {
    count++;
    return count;
  };
}

const nextTicket = makeCounter();
const otherQueue = makeCounter();
console.log(nextTicket(), nextTicket(), nextTicket(), otherQueue());
```

```text
1 2 3 1
```

Each call of `makeCounter` creates a new `count`, and the arrow function it returns keeps that one
`count`. No other code can reach it, so closures are also a way to keep state private.

## Recursion

A function that calls itself is **recursive**. It must have a **base case** that stops the
calls:

```ts
function factorial(n: number): number {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

console.log(factorial(5), factorial(10));
```

```text
120 3628800
```

`factorial(5)` is `5 * factorial(4)`, and so on down to `factorial(1)`, which returns 1 without
calling itself.

## Common mistakes

- **No base case.** `function countdown(n: number): number { return countdown(n - 1); }` compiles,
  then fails with `RangeError: Maximum call stack size exceeded`. Every recursive function needs a
  case that returns without recursing.
- **Calling instead of passing.** `applyTwice(5, double(5))` passes the number 10, not the
  function; the compiler rejects it with TS2345. Pass `double`.
- **Missing return on a path.** TS2366, as above. Add the missing case or a final `return`.
- **Unannotated parameters.** TS7006 in strict mode. Annotate every parameter of a declared
  function.

## Practice

1. Write `average(...values: number[]): number` that returns 0 when given no values.
2. Write an arrow function `isEven` that returns whether a number is even.
3. Write `makeMultiplier(factor: number): (n: number) => number`. What is `makeMultiplier(3)(7)`?
4. Write a recursive `sumTo(n)` that adds 1 to `n`, using the conditional operator.

### Answers

```ts
function average(...values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
}

const isEven = (n: number): boolean => n % 2 === 0;

function makeMultiplier(factor: number): (n: number) => number {
  return (n) => n * factor;
}

function sumTo(n: number): number {
  return n <= 0 ? 0 : n + sumTo(n - 1);
}

const triple = makeMultiplier(3);
console.log(average(4, 8, 9), average(), isEven(10), isEven(7), triple(7), sumTo(100));
```

```text
7 0 true false 21 5050
```

`triple` is a closure that remembers `factor` = 3.

## Key takeaways

- Annotate every parameter; write the return type to state intent. Calls are checked in number
  and type.
- A function with a return type must return on every path (TS2366).
- Arrow functions return a single expression without `return`.
- `name = value` is a default, `name?: T` is optional (`T | undefined`), `...rest: T[]` collects the
  rest.
- `(n: number) => number` is a function type; `void` means no value, `never` means no return.
- Closures keep the variables they use; recursion needs a base case.

## Further reading

- [TypeScript handbook: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [MDN: Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)
