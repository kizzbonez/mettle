---
title: What JavaScript and TypeScript Are
summary: Learn what a program is, where JavaScript runs, and how TypeScript adds types that a compiler checks before your code runs and then erases, so that the program Node.js runs is plain JavaScript.
minutes: 20
objectives:
  - Explain what a program, a programming language, a runtime and a compiler are
  - Describe where JavaScript runs, in web browsers and on Node.js
  - Explain what TypeScript adds to JavaScript and what "checked, then erased" means
  - List what the TypeScript compiler checks and what it cannot check
---

## Outline

1. What a program is
2. JavaScript, in the browser and on Node.js
3. A bug JavaScript does not notice
4. TypeScript: JavaScript with types
5. Checked, then erased
6. What the compiler does not do
7. Why teams use TypeScript
8. The tools in this course

## What a program is

A **program** is a list of instructions that a computer carries out, one after another. You write
those instructions in a **programming language**, a kind of text with strict rules about what may
be written where. The text you write is called **source code**. A program usually takes some
**input** (text someone types, a file, a click) and produces **output** (text on the screen, a new
file).

Here is a complete program of one line:

```ts
console.log("Hello!");
```

```text
Hello!
```

`console.log(...)` prints whatever is between the parentheses. Text written between double quotes,
like `"Hello!"`, is a **string**: a piece of text that the program treats as data, not as
instructions.

## JavaScript, in the browser and on Node.js

JavaScript was created in 1995 to make web pages interactive, and every web browser contains a
JavaScript **engine**, the program that reads JavaScript and carries it out. In 2009, Node.js took
Chrome's engine, called V8, out of the browser, so that JavaScript could run on any computer: as a
command-line tool, a web server or a build script.

A program that runs other programs and lets them reach the outside world (the screen, files, the
network) is called a **runtime**. Browsers and Node.js are both JavaScript runtimes. This course
uses Node.js. The language itself is defined by a standard called ECMAScript, which gains a new
edition every year; this course uses ES2025.

## A bug JavaScript does not notice

This JavaScript program, saved as `area.js`, computes the floor area of a room:

```js
const room = { width: 4, length: 5 };
const area = room.width * room.lenght;
console.log("Area:", area);
```

Running it with `node area.js` prints:

```text
Area: NaN
```

`room` is an **object**, a value that groups other values under names: `width` is 4 and `length`
is 5. The second line has a typo, `lenght`. JavaScript does not stop: asking an object for a
property it does not have gives the special value `undefined`, and multiplying by `undefined` gives
`NaN`, short for "not a number". The program finishes, prints a wrong answer, and says nothing.

JavaScript is **dynamically typed**: what a value is, and what you may do with it, is only looked
at while the program runs, and many mistakes like this one are not reported at all. In a large
program such a value can travel a long way before anyone notices.

## TypeScript: JavaScript with types

A **type** describes a kind of value and what you can do with it. `4` is a number, so you can
multiply it; `"Ada"` is a string, so you can turn it into capitals. **TypeScript** is JavaScript
plus a way to write types down, together with a program, the TypeScript compiler `tsc`, that checks
every use of every value against its type *before* the program runs. Checking without running is
called **static type checking**.

The same three lines saved as `area.ts` and given to the compiler produce:

```text
area.ts(2,32): error TS2551: Property 'lenght' does not exist on type '{ width: number; length: number; }'. Did you mean 'length'?
```

Nobody wrote a type here. The compiler worked out, or **inferred**, that `room` has the type
`{ width: number; length: number; }` and that no property called `lenght` exists. The message names
the file, the line (2) and the column (32) of the mistake.

Every JavaScript program is also valid TypeScript, which is why TypeScript is called a *superset*
of JavaScript. What TypeScript adds is **type annotations**, written after a colon:

```ts
function roomArea(width: number, length: number): number {
  return width * length;
}

console.log("Area:", roomArea(4, 5));
console.log("Area:", roomArea("4", 5));
```

```text
area.ts(6,31): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

A **function** is a named piece of code that you can run, or **call**, with different values; lesson
7 covers them. The annotations say that `roomArea` takes two numbers and gives back a number.
`"4"` is in quotes, so it is a string, and the compiler rejects the call on line 6 before it can
produce a wrong answer.

## Checked, then erased

Delete the last line and the compiler is satisfied. A **compiler** is a program that translates
source code into another form; `tsc` translates TypeScript into JavaScript:

```js
function roomArea(width, length) {
    return width * length;
}
console.log("Area:", roomArea(4, 5));
export {};
//# sourceMappingURL=area.js.map
```

The types are gone: TypeScript **erases** them. (The line `export {};` marks the file as a module,
which lesson 13 explains, and the last line points to a *source map*, which lets error messages
refer to lines of the `.ts` file.) Node.js then runs the JavaScript:

```text
Area: 20
```

The TypeScript handbook sums this up as "JavaScript's runtime with a compile-time type checker".
Types never change what a program does. They only decide whether the compiler accepts it.

## What the compiler does not do

- **It does not run your code**, and the JavaScript it writes is not faster than JavaScript you would
  have written yourself.
- **It does not check values while the program runs.** The types are gone by then. Data that
  arrives from outside, such as what a user types, is only checked if your code checks it (lessons
  10, 11 and 13).
- **It does not catch every bug.** `roomArea(4, 50)` when you meant 5 is a perfectly well-typed
  mistake. Tests catch those.

## Why teams use TypeScript

- Mistakes like `lenght` are found while you type, not by your users.
- Editors use the types to suggest property names, rename things safely and jump to definitions.
- A function's types document what it expects and what it returns.
- When a type changes, the compiler lists every line that must change with it.

## The tools in this course

- **TypeScript 7**, released in July 2026. Its compiler was rewritten in Go as native code and is
  about ten times faster than TypeScript 6, with the same type checking. You install it from npm
  as the package `typescript`, and its command is still `tsc`.
- **Node.js 26**, which becomes the Long Term Support (LTS) release line on 28 October 2026 and is
  supported until April 2029.
- **Strict mode** always on. Since TypeScript 6.0, `strict` is the default; it turns on the checks
  that catch the most bugs, and every example in this course is checked with it.

## Common mistakes

- **Believing types check data while the program runs.** `JSON.parse` turns text into a value at
  run time, so the compiler cannot know what it returns and trusts the annotation:

  ```ts
  const count: number = JSON.parse("\"three\"");
  console.log(count * 2);
  ```

  ```text
  NaN
  ```

  No error, because the types were erased. Values from outside must be checked by code.
- **Treating "no type errors" as "correct".** The compiler checks kinds of values, not your
  intent. Test what the program prints.
- **Following an old tutorial.** Many were written for older defaults. In TypeScript 7,
  `"target": "es5"` in a configuration file is an error:

  ```text
  tsconfig.json(6,15): error TS5108: Option 'target=ES5' has been removed. Please remove it from your configuration.
  ```

  Use the settings in lesson 2.

## Practice

1. Sort these into runtimes and compilers: Node.js, `tsc`, the Chrome browser.
2. What does the compiler report for this program?

   ```ts
   const room = { width: 4, length: 5 };
   console.log(room.height);
   ```
3. What JavaScript does `tsc` write for `const learner: string = "Ada";` followed by
   `console.log(learner);`?

### Answers

1. Node.js and Chrome are runtimes: they run JavaScript. `tsc` is a compiler: it checks TypeScript
   and translates it into JavaScript, but runs nothing.
2. The compiler inferred the object's type and finds no `height` in it:

   ```text
   main.ts(2,18): error TS2339: Property 'height' does not exist on type '{ width: number; length: number; }'.
   ```
3. The same code with the annotation erased, plus the two lines the compiler adds:

   ```js
   const learner = "Ada";
   console.log(learner);
   export {};
   //# sourceMappingURL=learner.js.map
   ```

## Key takeaways

- A program is source code that a runtime carries out. Browsers and Node.js run JavaScript.
- TypeScript is JavaScript plus types. The compiler checks them before the program runs, then
  erases them, so what runs is plain JavaScript.
- The compiler infers many types by itself; annotations after a colon state them explicitly.
- Types cannot check data that arrives while the program runs, and cannot catch logic mistakes.
- This course uses TypeScript 7 and Node.js 26 with strict checking always on.

## Further reading

- [TypeScript handbook: TypeScript for the New Programmer](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
- [TypeScript handbook: The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [MDN: JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
