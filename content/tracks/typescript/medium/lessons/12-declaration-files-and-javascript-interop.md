---
title: Declaration Files and JavaScript Interop
summary: Read and write `.d.ts` declaration files, describe code that exists elsewhere with `declare`, type an untyped npm package with an ambient module declaration, know where `@types` packages come from, and type-check plain JavaScript with JSDoc comments and `checkJs`.
minutes: 35
objectives:
  - Explain what a `.d.ts` file contains and generate one with `--declaration`
  - Use `declare` to describe values that exist at run time, and explain why it creates nothing
  - Type an untyped npm package with a `declare module` block
  - Add JSDoc types to a JavaScript file and check it with `checkJs` or `// @ts-check`
---

## Outline

1. Types without code
2. Generating a declaration file
3. `declare`: values that exist elsewhere
4. Typing an untyped package
5. Where `@types` packages come from
6. Checking JavaScript with JSDoc

## Types without code

Most of the npm registry is JavaScript, and even packages written in TypeScript are published as
compiled JavaScript. So how does the compiler know the types of a function inside
`node_modules`? From a **declaration file**: a file ending in `.d.ts` that contains only types,
the signatures of functions, the shapes of classes and the interfaces a module exports, and no
code that runs. When you hover over `readFile` in an editor, you are reading a declaration from
`@types/node`.

A declaration file is a contract. The compiler believes it completely and checks your code
against it, but it cannot check that the JavaScript behind it really behaves that way.

## Generating a declaration file

You rarely write declarations for your own TypeScript, because the compiler writes them. The
option `--declaration` (in `tsconfig.json`, `"declaration": true`) emits a `.d.ts` next to each
`.js` file. Take this module:

```ts
export interface Glaze {
  name: string;
  cone: number;
}

export const DEFAULT_CONE = 6;

export function describeGlaze(glaze: Glaze): string {
  return `${glaze.name} (cone ${glaze.cone})`;
}

export class GlazeShelf {
  #glazes: Glaze[] = [];

  add(glaze: Glaze): number {
    return this.#glazes.push(glaze);
  }
}
```

`tsc --module nodenext --declaration --outDir out glaze.ts` writes `out/glaze.js`, with the
types removed, and `out/glaze.d.ts`:

```ts
export interface Glaze {
    name: string;
    cone: number;
}
export declare const DEFAULT_CONE = 6;
export declare function describeGlaze(glaze: Glaze): string;
export declare class GlazeShelf {
    #private;
    add(glaze: Glaze): number;
}
```

The two files split the original between them: the `.js` file keeps the behavior, the `.d.ts`
keeps the types. Function bodies are gone, the private field is reduced to a marker, and every
value carries the keyword `declare`. A package publishes both, so its users get type checking
without its source. The professional level returns to this when publishing packages.

## `declare`: values that exist elsewhere

`declare` tells the compiler "this exists at run time; here is its type". It is used for things
your TypeScript did not create: a global set by a script tag, a value injected by a build tool,
a function provided by the host. A declaration with `declare` is called **ambient**, and it
produces no JavaScript. That makes it powerful and dangerous, as this program shows:

```ts
// globals.d.ts
declare const KILN_ID: string;
```

```ts
// main.ts
console.log(`kiln ${KILN_ID.toUpperCase()}`);
```

```text
/tmp/work/main.ts:1
console.log(`kiln ${KILN_ID.toUpperCase()}`);
                    ^

ReferenceError: KILN_ID is not defined
```

It compiled, because the declaration promised a `string`, and it crashed, because nothing ever
created `KILN_ID`. A declaration describes; it never creates. Only declare what you know exists.

## Typing an untyped package

Lesson 1 met the error for a JavaScript package with no types. Here it is again for a small
package, `kiln-colours`, whose `index.js` exports `colourFor(celsius)` and `VERSION`:

```ts
import { colourFor, VERSION } from "kiln-colours";

console.log(`kiln-colours ${VERSION}`);
for (const celsius of [650, 1050, 1260]) {
  console.log(celsius, colourFor(celsius));
}
```

```text
main.ts(1,36): error TS7016: Could not find a declaration file for module 'kiln-colours'. '/tmp/work/node_modules/kiln-colours/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/kiln-colours` if it exists or add a new declaration (.d.ts) file containing `declare module 'kiln-colours';`
```

When no `@types` package exists, write the declaration yourself. A `declare module "name"` block
in any `.d.ts` file that the project includes is an **ambient module declaration**: it describes
what importing that name gives you.

```ts
// kiln-colours.d.ts
declare module "kiln-colours" {
  export function colourFor(celsius: number): string;
  export const VERSION: string;
}
```

```text
kiln-colours 1.4.0
650 red
1050 yellow
1260 white
```

Now calls are checked: adding `colourFor("hot")` gives error TS2345, "Argument of type 'string'
is not assignable to parameter of type 'number'." Declare only what you use, and read the
package's documentation or source to get the types right, since nothing verifies them.

The error message also offers a shortcut: `declare module 'kiln-colours';` with no body. This
**shorthand ambient module** silences the error by making every import `any`. It is an escape
hatch for getting started, not a solution.

## Where `@types` packages come from

For popular JavaScript libraries, someone has already written the declarations. The
**DefinitelyTyped** project collects them, and npm publishes each as `@types/<name>`, such as
`@types/node`. Look in this order:

1. Does the package ship its own types? Its `package.json` then names a `types` file, or its
   `exports` point at `.d.ts` files. Nothing to install.
2. Is there an `@types/<name>` package? Install it with `npm install -D @types/<name>`. Global
   types such as Node's must also be listed in `"types"` in `tsconfig.json`, which defaults to
   `[]` since TypeScript 6.
3. Otherwise, write a `declare module` block yourself.

## Checking JavaScript with JSDoc

Sometimes the code itself is JavaScript: an older part of a project, or a build script. With
`"allowJs": true`, the compiler accepts `.js` files in the project, and TypeScript code can import
them. With `"checkJs": true` it also type-checks them, reading types from **JSDoc** comments,
the `/** ... */` comments with tags such as `@param`, `@returns`, `@type` and `@typedef`:

```js
/**
 * @typedef {object} Firing
 * @property {string} kiln
 * @property {number} peakCelsius
 */

/**
 * @param {Firing[]} firings
 * @returns {number}
 */
export function hottest(firings) {
  return Math.max(...firings.map((firing) => firing.peakCelsius));
}

console.log(hottest([{ kiln: "K1", peakCelsius: "1260" }]));
```

```ts
// main.ts
import { hottest } from "./firing.js";

console.log(hottest([{ kiln: "K2", peakCelsius: 1222 }]));
hottest([{ kiln: "K3" }]);
```

```text
firing.js(15,36): error TS2322: Type 'string' is not assignable to type 'number'.
main.ts(4,10): error TS2741: Property 'peakCelsius' is missing in type '{ kiln: string; }' but required in type 'Firing'.
```

The JavaScript file is checked like TypeScript, and `main.ts` sees the type `Firing` defined in a
comment. Without `checkJs`, a single file can opt in with `// @ts-check` as its first line, which
is a gentle way to start on a large JavaScript project. JSDoc types use TypeScript's syntax inside
braces, and `@import` brings in types from other files. TypeScript 7 reworked its JavaScript
support to match how it checks `.ts` files, and dropped some older forms: `@enum` is no longer
special, and Closure-style function types such as `function(string): void` must be written as
arrow types, `(text: string) => void`.

## Common mistakes

- **Declaring something that does not exist.** `declare` creates nothing; the result is a
  `ReferenceError` at run time.
- **Leaving `declare module 'x';` in place for good.** Everything from `x` is `any`. Write real
  signatures for what you use.
- **Putting code in a `.d.ts` file.** A function body there is error TS1183, "An implementation
  cannot be declared in ambient contexts." Beware: the common setting `"skipLibCheck": true`
  skips checking `.d.ts` files, so such mistakes can go unreported.
- **Expecting JSDoc to be checked without `checkJs` or `// @ts-check`.** With only `allowJs`, a
  `.js` file is compiled but not checked.

## Practice

1. The package `label-maker` exports `makeLabel(text, options)`, where `options` is optional and
   has a numeric `width` and an optional boolean `bold`. Write its declaration, including an
   exported `LabelOptions` interface, and use it.
2. Add JSDoc to `export function area(width, height) { return width * height; }` so that
   `area("3", 4)` is reported, without turning on `checkJs`.
3. What is the difference between `declare module "label-maker";` and your answer to 1?

### Answers

```ts
// label-maker.d.ts
declare module "label-maker" {
  export interface LabelOptions {
    width: number;
    bold?: boolean;
  }
  export function makeLabel(text: string, options?: LabelOptions): string;
}
```

```ts
// main.ts
import { makeLabel, type LabelOptions } from "label-maker";

const shelf: LabelOptions = { width: 12, bold: true };
console.log(makeLabel("glazes"));
console.log(makeLabel("clay", shelf));
```

```text
glazes..............
CLAY........
```

```js
// @ts-check

/**
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
export function area(width, height) {
  return width * height;
}

console.log(area(3, 4));
console.log(area("3", 4));
```

```text
area.js(13,18): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

3. The shorthand makes every import from `label-maker` `any`, so nothing is checked; the full
   declaration checks every call.

## Key takeaways

- A `.d.ts` file holds only types; `--declaration` writes them for your own code.
- `declare` describes values that exist elsewhere and emits nothing, so a wrong declaration
  compiles and then fails.
- `declare module "name" { ... }` types an untyped package; `@types/<name>` from DefinitelyTyped
  covers popular ones.
- `allowJs` lets TypeScript use JavaScript files; `checkJs` or `// @ts-check` checks them using
  JSDoc types.

## Further reading

- [TypeScript Handbook: Declaration reference](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [TypeScript Handbook: JSDoc reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TypeScript Handbook: Type checking JavaScript files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
