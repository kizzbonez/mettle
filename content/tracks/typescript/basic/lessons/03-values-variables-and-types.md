---
title: Values, Variables and Types
summary: Name values with const and let, meet the seven primitive types, let the compiler infer types or annotate them yourself, inspect a value with typeof while the program runs, and choose unknown over any when you do not know what a value is.
minutes: 25
objectives:
  - Declare variables with `const` and `let`, and explain why `var` is no longer used
  - Name the seven primitive types and write values of each
  - Explain type inference, and add an annotation where one is needed
  - Use `typeof` at run time, and explain the difference between `any` and `unknown`
---

## Outline

1. Values and variables
2. `const`, `let`, and why not `var`
3. The primitive types
4. Inference and annotations
5. `typeof` while the program runs
6. `any` versus `unknown`
7. Naming

## Values and variables

A **value** is a piece of data: the number `120`, the text `"Lima"`, the answer `true`. A
**variable** is a name that refers to a value, so that you can use it later. You **declare** a
variable with a keyword, a name, `=` and the value it starts with:

```ts
const city = "Lima";
let visitors = 120;
visitors = visitors + 15;
console.log(city, visitors);
```

```text
Lima 135
```

The `=` sign means "make this name refer to this value", which is called **assignment**. It is not
a statement that two things are equal: `visitors = visitors + 15` reads the current value, 120,
adds 15, and makes `visitors` refer to the result. `console.log` prints every value you give it,
separated by spaces. Each **statement**, a single instruction, ends with a semicolon.

## `const`, `let`, and why not `var`

- `const` declares a name that can never be assigned again.
- `let` declares a name that can be assigned a new value later.

Both exist only inside the block of code where they are declared, which lesson 6 shows. Use
`const` by default, and `let` only for a value that really changes, such as a running total.
Someone reading `const` knows the name keeps its value. The compiler holds you to both:

```ts
const city = "Lima";
city = "Quito";
let visitors = 120;
visitors = "many";
```

```text
main.ts(2,1): error TS2588: Cannot assign to 'city' because it is a constant.
main.ts(4,1): error TS2322: Type 'string' is not assignable to type 'number'.
```

The second error is TypeScript's main idea at work: `visitors` started as a number, so its type
is `number`, and it may only ever hold numbers.

Older code uses a third keyword, `var`. It ignores blocks (a `var` declared inside a block is
visible outside it), it can be declared twice, and reading it before its declaration quietly gives
`undefined` instead of an error. `let` and `const` replaced it in 2015. Never write `var`.

## The primitive types

JavaScript has seven **primitive types**, the simplest kinds of value, and TypeScript names each
one:

| Type | Values | Example |
| --- | --- | --- |
| `string` | text | `"Field notes"` |
| `number` | numbers, whole or with a fraction | `48`, `3.75` |
| `boolean` | yes or no | `true`, `false` |
| `bigint` | whole numbers of any size | `602214076000000000000000n` |
| `symbol` | unique identifiers | `Symbol("tag")` |
| `null` | "deliberately no value" | `null` |
| `undefined` | "no value given" | `undefined` |

You will use `string`, `number` and `boolean` all the time, `null` and `undefined` often (lesson
10), `bigint` rarely (lesson 5) and `symbol` almost never. There is no separate type for whole
numbers: `48` and `3.75` are both `number`. Write the type names in lower case: `String` and
`Number` with capitals are something else, and the handbook says to always use the lower-case
names.

## Inference and annotations

You can state a variable's type with a **type annotation**, a colon and a type after the name. You
usually do not need to, because the compiler **infers** the type from the starting value:

```ts
const title: string = "Field notes";
const pages: number = 48;
const finished: boolean = false;
const atoms: bigint = 602214076000000000000000n;
const tag: symbol = Symbol("tag");
const nothing: null = null;
const notSet: undefined = undefined;
console.log(typeof title, typeof pages, typeof finished, typeof atoms);
console.log(typeof tag, typeof nothing, typeof notSet);
```

```text
string number boolean bigint
symbol object undefined
```

Every annotation here is one the compiler would have inferred anyway. `const pages = 48;` gives
`pages` the type `number` just the same, and an editor shows the inferred type when you hover over
the name. Leave annotations out when the starting value makes the type obvious, and write one
when there is no starting value:

```ts
let total: number;
console.log(total);
```

```text
main.ts(2,13): error TS2454: Variable 'total' is used before being assigned.
```

The annotation tells the compiler what `total` will hold, and strict checking then makes sure it
is given a value before anyone reads it.

## `typeof` while the program runs

Types are erased when the program runs, but every value still knows what kind of value it is.
The `typeof` operator, written before a value, gives its kind as a string. The output above shows
each result, with one surprise: `typeof null` is `"object"`. This is a mistake from the first
version of JavaScript in 1995 that can no longer be fixed without breaking old web pages, so
remember it. `typeof` is how a program checks a value it is not sure about, as the next section
shows.

## `any` versus `unknown`

Sometimes you do not know a value's type in advance, for example when it comes from outside the
program. TypeScript has two types for this, and they behave in opposite ways.

`any` switches checking off. The compiler accepts anything you do with the value:

```ts
const loose: any = "seven";
console.log(loose.toFixed(1));
```

It compiles without a word and then fails while running (stack trace cut here):

```text
/tmp/work/main.ts:2
console.log(loose.toFixed(1));
                  ^

TypeError: loose.toFixed is not a function
```

`toFixed` formats numbers, and `"seven"` is a string. `unknown` is the safe version: it accepts
any value too, but lets you do nothing with it until you have checked what it is:

```ts
const careful: unknown = "seven";
console.log(careful.toUpperCase());
```

```text
main.ts(2,13): error TS18046: 'careful' is of type 'unknown'.
```

Checking with `typeof` inside an `if` (lesson 6) convinces the compiler:

```ts
const careful: unknown = "seven";
if (typeof careful === "string") {
  console.log(careful.toUpperCase());
}
```

```text
SEVEN
```

Inside the braces, the compiler knows `careful` is a string, because the code only gets there if
`typeof` said so. Making a type more precise by checking is called **narrowing**, and lesson 11 is
about it. Prefer `unknown` to `any`, always.

## Naming

A name may contain letters, digits, `_` and `$`, and may not start with a digit. Names are case
sensitive: `total` and `Total` are different. Keywords of the language cannot be names:

```ts
const class = "B2";
```

```text
main.ts(1,7): error TS1389: 'class' is not allowed as a variable declaration name.
main.ts(1,13): error TS1005: '{' expected.
```

By convention, variables are written in **camelCase** (`visitorCount`), and types, which you will
write from lesson 9, in **PascalCase** (`Visitor`). Choose names that say what a value means:
`visitorCount`, not `n` or `data2`.

## Common mistakes

- **Using `let` for a value that never changes.** It compiles, but hides your intent. Write
  `const`, and switch to `let` only when the compiler reports TS2588 because you really do
  reassign.
- **Changing a variable's type.** `let visitors = 120;` followed by `visitors = "many";` is error
  TS2322. Use a second variable with its own name.
- **Using `any` to silence an error.** The error moves from the compiler to your user, as
  `TypeError: loose.toFixed is not a function`. Use `unknown` and check.
- **Expecting `typeof null` to be `"null"`.** It is `"object"`. Compare with `=== null` instead
  (lesson 10).

## Practice

1. Declare a `const` for a river's name and a `let` for its length in kilometres, then increase
   the length by 2 and print both.
2. What does the compiler say about `const level = 3;` followed by `level = 4;`?
3. Predict `typeof` for `false`, `10n`, `null` and `"10"`.

### Answers

1. ```ts
   const river = "Rhine";
   let lengthKm = 1230;
   lengthKm = lengthKm + 2;
   console.log(river, lengthKm);
   ```

   ```text
   Rhine 1232
   ```
2. `error TS2588: Cannot assign to 'level' because it is a constant.` Use `let` if the value must
   change.
3. `"boolean"`, `"bigint"`, `"object"` (the old quirk) and `"string"`: the quotes make `"10"`
   text, not a number.

## Key takeaways

- `const` by default, `let` for values that change, never `var`.
- The primitive types are `string`, `number`, `boolean`, `bigint`, `symbol`, `null` and
  `undefined`.
- The compiler infers a variable's type from its first value and holds it to that type forever.
- `typeof` reports a value's kind while the program runs; `typeof null` is `"object"`.
- `any` turns checking off; `unknown` keeps it on until you narrow the value with a check.

## Further reading

- [TypeScript handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [TypeScript handbook: More on Functions, unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [MDN: let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [MDN: typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)
