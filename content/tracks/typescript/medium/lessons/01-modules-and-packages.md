---
title: Modules and Packages
summary: Split a program into ES modules with named and default exports, understand why `nodenext` module resolution makes you write `./file.js` in a `.ts` file, import types with `import type`, add npm packages and their `@types` definitions, and give your own folders short `#/` import paths.
minutes: 35
objectives:
  - Export and import values with named, default and namespace imports, and predict when a module's code runs
  - Explain how Node.js decides a file is an ES module and why relative imports name the `.js` file under `nodenext`
  - Use `import type` and explain why Node's type stripping needs it
  - Install an npm package with its type definitions and fix "Could not find a declaration file"
  - Map a `#/` subpath import in `package.json`
---

## Outline

1. What a module is
2. Exporting and importing
3. How Node.js knows a file is a module
4. `nodenext` and the `.js` extension
5. `import type`
6. npm packages and `@types`
7. Subpath imports with `#/`

## What a module is

The last basic lesson ended with a first `export` and `import`. This lesson makes them a habit. In
TypeScript and modern JavaScript, a **module** is a file that contains `import` or `export`. Each
module has its own scope: a `const` declared at the top of one file is invisible in another unless
the first file **exports** it and the second **imports** it. The standard that defines this is
called **ES modules** (ESM, from ECMAScript, the official name of JavaScript).

Two rules matter from the start. A module's top-level code runs **once**, the first time anything
imports it, and every later import shares the same module. And imports are processed before the
importing file's own code runs.

## Exporting and importing

A module can have any number of **named exports** and at most one **default export**:

```ts
// units.ts
export const GRAMS_PER_OUNCE = 28.3495;

export function toGrams(ounces: number): number {
  return ounces * GRAMS_PER_OUNCE;
}

export function toOunces(grams: number): number {
  return grams / GRAMS_PER_OUNCE;
}

export default function formatGrams(grams: number): string {
  return `${grams.toFixed(1)} g`;
}

console.log("units.ts has loaded");
```

```ts
// main.ts
import formatGrams, { toGrams, toOunces as gramsToOunces } from "./units.js";
import * as units from "./units.js";

console.log(formatGrams(toGrams(4)));
console.log(gramsToOunces(250).toFixed(2));
console.log(units.GRAMS_PER_OUNCE);
```

```text
units.ts has loaded
113.4 g
8.82
28.3495
```

The first import line shows three forms at once. `formatGrams` without braces receives the default
export, and you may call it whatever you like. Names in braces must match named exports exactly,
and `as` renames one locally. `import * as units` is a **namespace import**: one object whose
properties are all the named exports. `units.ts` was imported twice, yet "has loaded" printed
once, before any line of `main.ts`.

Many teams prefer named exports, because the exporting file fixes the name everyone uses.

## How Node.js knows a file is a module

Node.js supports two module systems: ES modules and the older **CommonJS** (`require` and
`module.exports`). It decides per file:

- `.mjs` files are always ES modules and `.cjs` files always CommonJS.
- A `.js` file is an ES module when the nearest `package.json` contains `"type": "module"`, and
  CommonJS otherwise.

TypeScript applies the same rules to your sources: `.mts` compiles to `.mjs`, `.cts` to `.cjs`, and
`.ts` to `.js`, whose format comes from `"type"`. New projects put this in `package.json` and write
ES modules only:

```json
{
  "type": "module"
}
```

## `nodenext` and the `.js` extension

`tsconfig.json` tells the compiler which host it is writing for. For a program that runs on
Node.js, the TypeScript documentation is blunt: the only correct `module` settings are `node16`
and `nodenext`, and `moduleResolution` goes with them. With `"module": "nodenext"`, TypeScript
checks your imports by Node's own rules, and Node's rule for ES modules is strict: **a relative
import must name the file, extension included.** Node does no guessing of extensions and no
`index.js` lookup.

The compiler also never rewrites an import path. `main.ts` becomes `main.js`, `units.ts` becomes
`units.js`, and the string `"./units.js"` is copied as it is. So you write the name of the file
that will exist at run time, and the compiler maps `./units.js` back to `units.ts` to find its
types. Leave the extension out and you get:

```text
main.ts(1,65): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './units.js'?
```

Writing `"./units.ts"` instead is refused too, because the emitted `main.js` would then import a
`.ts` file:

```text
main.ts(1,65): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
```

There is one style where `.ts` is right. Node.js 26 can run `node main.ts` directly by
**stripping** the types, and there no `.js` file exists, so `"./units.js"` fails with
`ERR_MODULE_NOT_FOUND`. Projects that run this way import `"./units.ts"` and set
`"rewriteRelativeImportExtensions": true`, which lets `tsc` accept `.ts` imports and rewrite them
to `.js` when it does emit. Choose one style per project; the labs of this course compile with
`tsc`, so they use `.js`.

## `import type`

A **type-only import** brings in names used only as types and is erased completely. Here
`recipe.ts` exports an interface `Recipe` and a function `describe`:

```ts
import { describe, Recipe } from "./recipe.ts";

const bread: Recipe = { name: "Rye loaf", grams: 900 };
console.log(describe(bread));
```

Run with `node main.ts`, this fails, because type stripping only deletes type syntax and cannot know
that `Recipe` is an interface:

```text
SyntaxError: The requested module './recipe.ts' does not provide an export named 'Recipe'
```

Mark it as a type, either for the whole line (`import type { Recipe } from ...`) or per name:

```ts
import { describe, type Recipe } from "./recipe.ts";
```

```text
Rye loaf: 900 g
```

`tsc` on its own quietly drops such an import, which hides the problem. The option
`verbatimModuleSyntax` (professional level) makes it insist on the marker with error TS1484.

## npm packages and `@types`

An import that does not start with `.`, `/` or `#` is a **bare specifier**: a package. `node:fs`
and `node:path` name Node's built-in modules. Anything else is looked up in `node_modules`, where
**npm** installs packages:

```console
$ npm install lodash
$ npm install -D @types/lodash
```

Many packages ship their own `.d.ts` type files (their `package.json` names them). Others are
plain JavaScript, and the community publishes their types separately as `@types/<name>` from the
DefinitelyTyped project. Types are only needed at build time, so they go in `devDependencies`
(`-D`). Without them, the compiler refuses to guess:

```text
main.ts(2,15): error TS7016: Could not find a declaration file for module 'lodash'. '/tmp/work/node_modules/lodash/lodash.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/lodash` if it exists or add a new declaration (.d.ts) file containing `declare module 'lodash';`
```

Since TypeScript 6, `types` defaults to `[]`: global types such as Node's `process` are only loaded
when listed, so a Node project keeps `"types": ["node"]` after installing `@types/node`. Lesson 12
shows how to write a declaration file yourself.

## Subpath imports with `#/`

Deep relative paths such as `"../../lib/units.js"` break whenever a file moves. Node's **subpath
imports** let a package define private aliases in `package.json`. Their keys must start with `#`,
and since Node.js 25.4 and TypeScript 6.0 a plain `#/` prefix is allowed:

```json
{
  "type": "module",
  "imports": {
    "#/*": "./dist/*"
  }
}
```

With `"rootDir": "src"` and `"outDir": "dist"`, `src/main.ts` can write
`import { toGrams } from "#/lib/units.js";` from any depth. The map points at the compiled files
Node will run, and TypeScript maps `dist/lib/units.js` back to `src/lib/units.ts`.

## Common mistakes

- **Leaving out the extension**: `from "./units"` is TS2835 under `nodenext`. Write `"./units.js"`.
- **Expecting `tsc` to fix paths.** It copies them. A path that is wrong in the source is wrong in
  the output.
- **Importing an interface as a value** in code run by `node file.ts`: the run fails with "does not
  provide an export named". Add `type`.
- **Using a default import for a named export**: `import toGrams from "./units.js"` binds the
  default export, `formatGrams`, under the name `toGrams`. Use braces for named exports.
- **Installing `@types/x` as a normal dependency.** It is a build tool; use `-D`.

## Practice

1. `temperature.ts` exports an interface `Reading`, a named function `toFahrenheit` and a default
   function `describe`. Write one import line in `main.ts` that brings in all three correctly.
2. Which of `"./temperature"`, `"./temperature.js"` and `"./temperature.ts"` does `tsc` accept with
   `module: nodenext` and default options, and why?
3. A project runs `node main.ts` directly. Which import specifier should `main.ts` use for
   `temperature.ts`, and which `tsconfig` option lets `tsc` accept it?

### Answers

1. Default first, then the named ones, marking the type:

   ```ts
   import describe, { toFahrenheit, type Reading } from "./temperature.js";

   const reading: Reading = { celsius: 25, place: "Lisbon" };
   console.log(toFahrenheit(100));
   console.log(describe(reading));
   ```

   ```text
   212
   Lisbon: 77 F
   ```

2. Only `"./temperature.js"`. The first is TS2835, because Node requires the extension; the
   second names the file that will exist after compiling; the third is TS5097, because the
   emitted JavaScript would import a `.ts` file.
3. `"./temperature.ts"`, because no `.js` file exists when Node strips types. Set
   `rewriteRelativeImportExtensions` so `tsc` accepts it (and rewrites it if it emits).

## Key takeaways

- A module is a file with `import` or `export`; its code runs once, on first import.
- `"type": "module"` makes `.js` files ES modules. With `module: nodenext`, relative imports name
  the output file, `./units.js`, because Node needs the extension and `tsc` never rewrites paths.
- Mark type-only imports with `type`; type stripping needs it.
- Packages without bundled types need `@types/<name>` in `devDependencies`, and `types: ["node"]`
  loads Node's globals.
- `"imports": { "#/*": ... }` gives your own files short, stable paths.

## Further reading

- [TypeScript: Modules, theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html)
- [TypeScript: Modules reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [Node.js 26: Modules, packages (`type` and subpath imports)](https://nodejs.org/docs/latest-v26.x/api/packages.html)
- [Node.js 26: Modules, TypeScript](https://nodejs.org/docs/latest-v26.x/api/typescript.html)
