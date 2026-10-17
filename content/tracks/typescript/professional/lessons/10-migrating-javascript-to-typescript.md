---
title: Migrating JavaScript to TypeScript
summary: Move a JavaScript codebase to TypeScript one step at a time, with allowJs and checkJs, JSDoc types and TypeScript 7's stricter JSDoc rules, file-by-file renames, strictness raised one flag at a time, and a budget that makes suppressed errors only go down.
minutes: 35
objectives:
  - Compile and check JavaScript with allowJs and checkJs, and type it with JSDoc comments
  - Recognize the JSDoc patterns TypeScript 7 no longer accepts and rewrite them
  - Plan a migration that renames files in dependency order and raises strictness flag by flag
  - Keep @ts-expect-error under control with a budget enforced in CI
---

## Outline

1. Why migrate incrementally
2. Step 1: let tsc build the JavaScript
3. Step 2: check JavaScript with `checkJs`
4. Step 3: JSDoc types, and what TypeScript 7 changed
5. Step 4: rename files, leaves first
6. Step 5: raise strictness one flag at a time
7. A budget for suppressions

## Why migrate incrementally

A codebase of a few hundred JavaScript files cannot stop for a month while someone rewrites it. A **big-bang** migration, converting everything in one branch, collides with every feature merged meanwhile and ships a mountain of change at once. An **incremental** migration keeps the program working and deployable after every step: TypeScript first checks JavaScript as it is, then file by file the code becomes TypeScript, and strictness rises in measured steps. Each step is a small pull request.

## Step 1: let tsc build the JavaScript

Add TypeScript and a `tsconfig.json` with **`allowJs`**, which lets JavaScript files be part of the program, compiled into `outDir` next to future `.ts` files. TypeScript 7 defaults to `strict: true`, which an untyped codebase cannot pass yet, so a migration config sets it off explicitly for now:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "types": ["node"],
    "rootDir": "src",
    "outDir": "dist",
    "allowJs": true,
    "strict": false
  },
  "include": ["src"]
}
```

The build now runs through `tsc` and nothing else changes. A `.ts` file can already import a `.js` module, and the editor gives completions inferred from the JavaScript.

## Step 2: check JavaScript with `checkJs`

**`checkJs`** reports type errors in JavaScript files too, using what TypeScript can infer. To go gently, leave it off and add `// @ts-check` at the top of one file at a time; `// @ts-nocheck` excludes a file once `checkJs` is on. Even unannotated JavaScript yields real bugs:

```js
export const VAT_RATES = { standard: 0.2, reduced: 0.05 };

/**
 * @param {number} netCents
 * @param {"standard" | "reduced"} band
 * @returns {number}
 */
export function grossCents(netCents, band) {
  return Math.round(netCents * (1 + VAT_RATES[band]));
}

export function formatCents(cents) {
  return (cents / 100).toFixed(2) + " EUR";
}

console.log(formatCents(grossCents("1999", "standard")));
console.log(VAT_RATES.reducd);
```

With `checkJs` on and the default `strict`:

```text
src/rates.js(12,29): error TS7006: Parameter 'cents' implicitly has an 'any' type.
src/rates.js(16,36): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
src/rates.js(17,23): error TS2551: Property 'reducd' does not exist on type '{ standard: number; reduced: number; }'. Did you mean 'reduced'?
```

The typo and the string argument are bugs that were in production. The first error comes from `noImplicitAny`, part of `strict`, and an untyped codebase has thousands of those, which is why step 1 turned strictness off. The price: with `"strict": false` only the string argument is still reported, because in JavaScript files TypeScript reports an unknown property only under `noImplicitAny`. Step 5 wins those checks back.

## Step 3: JSDoc types, and what TypeScript 7 changed

**JSDoc** comments (`/** ... */` before a declaration) give JavaScript types without changing its syntax: `@param {number} netCents`, `@returns {number}`, `@type {string[]}` on a variable, and `@typedef` to name a type. The file stays valid JavaScript, and TypeScript files that import it see real types:

```js
export const Band = { STANDARD: "standard", REDUCED: "reduced" };

/** @typedef {"standard" | "reduced"} BandName */

/**
 * @param {number} netCents
 * @param {BandName} band
 * @returns {number}
 */
export function grossCents(netCents, band) {
  return Math.round(netCents * (band === Band.REDUCED ? 1.05 : 1.2));
}

/** @param {Band} band */
export function describe(band) {
  return String(band);
}
```

```ts
import { grossCents } from "./rates.js";

grossCents(1000, "zero");
```

```text
src/invoice.ts(3,18): error TS2345: Argument of type '"zero"' is not assignable to parameter of type 'BandName'.
src/rates.js(14,13): error TS2749: 'Band' refers to a value, but is being used as a type here. Did you mean 'typeof Band'?
```

The first error is the payoff: a TypeScript caller is checked against a JavaScript function. The second is new in TypeScript 7, which analyzes JavaScript with the same rules as TypeScript. Older versions quietly treated a value named in a JSDoc type as its type; now you write `{typeof Band}`, or better, a `@typedef`. Other JSDoc forms TypeScript 7 no longer accepts:

- `@enum`: use an object plus `@typedef {(typeof X)[keyof typeof X]}`;
- `@class` on a function: write a real `class`;
- Closure-style types such as `function(string): void` and a bare `?`: write `(s: string) => void` and `any`;
- a `@typedef` whose name is not written in the tag itself.

With `"declaration": true`, `tsc` even writes `.d.ts` files from JSDoc, here `export declare function grossCents(netCents: number, band: BandName): number;`.

## Step 4: rename files, leaves first

Converting a file means renaming `.js` to `.ts` and turning JSDoc into annotations. Go in dependency order: start with the **leaves**, modules that import nothing of yours (utilities, constants), so every file you convert depends only on code that is already typed. Keep each rename separate from behavior changes, so a reviewer sees types, not new logic. Imports keep their `.js` extension (lesson 1), so no caller changes when a module becomes TypeScript. Types that several modules share go into one `types.ts` early.

## Step 5: raise strictness one flag at a time

When the code is TypeScript, turn the `strict` family on member by member, fixing all errors for one flag before the next. Running `tsc --noEmit` with a flag added shows its cost before you commit to it. On a small legacy file:

```console
$ tsc --noEmit | grep -c "error TS"
0
$ tsc --noEmit --noImplicitAny | grep -c "error TS"
3
$ tsc --noEmit --noImplicitAny --strictNullChecks | grep -c "error TS"
4
$ tsc --noEmit --strict | grep -c "error TS"
5
```

The three `noImplicitAny` errors are untyped parameters (`values`, `sum`, `value`); each later flag adds one:

```text
src/report.ts(12,10): error TS18048: 'customer' is possibly 'undefined'.
src/report.ts(16,3): error TS2564: Property 'owner' has no initializer and is not definitely assigned in the constructor.
```

A common order: `noImplicitAny` (find the untyped code), then `strictNullChecks` (usually the most errors, and the most real bugs), then the rest of `strict`, then `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` from lesson 1. When the last flag is on, delete `"strict": false` and the config is back to TypeScript 7's defaults.

## A budget for suppressions

Some errors cannot be fixed today. Mark them with **`// @ts-expect-error`** and a reason, never `// @ts-ignore`: an expect-error becomes an error itself once the line no longer has one, so fixed problems do not leave stale suppressions behind. Then cap the total, so suppressions can only go down. A small script, run with Node's type stripping in CI:

```ts
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const BUDGET = 3;

let count = 0;
for (const file of await readdir("src", { recursive: true })) {
  if (!/\.[cm]?[jt]s$/.test(file)) continue;
  const text = await readFile(join("src", file), "utf8");
  count += text.match(/@ts-(expect-error|ignore)/g)?.length ?? 0;
}
console.log(`${count} suppressions, budget ${BUDGET}`);
if (count > BUDGET) {
  console.error("over budget: fix a type error instead of adding a suppression");
  process.exitCode = 1;
}
```

```console
$ node scripts/ts-debt.ts
4 suppressions, budget 3
over budget: fix a type error instead of adding a suppression
$ echo $?
1
```

Lower `BUDGET` whenever the count drops, and the debt shrinks with every release.

## Common mistakes

- **A big-bang rewrite** that stalls for weeks and conflicts with everything. Migrate in small, deployable steps.
- **`strict` left at TypeScript 7's default on day one** of an untyped codebase, burying the real bugs under thousands of implicit-any errors. Start with `"strict": false` and raise it.
- **Old JSDoc** (`@enum`, values as types, Closure function types) that TypeScript 7 rejects. Use `@typedef` and `typeof`.
- **`as any` everywhere** to make errors disappear. It hides the bugs the migration exists to find; prefer a counted `@ts-expect-error` with a reason.

## Practice

1. Fix both bugs in `rates.js` above and type `formatCents` with JSDoc.
2. Rewrite `/** @param {Band} band */` so TypeScript 7 accepts it and only allows the two values of `Band`.
3. In which order would you convert `format.js` (imports nothing), `invoice.js` (imports `format.js` and `rates.js`) and `rates.js` (imports `format.js`)?

### Answers

1. Call `grossCents(1999, "standard")`, read `VAT_RATES.reduced`, and put a JSDoc block with `@param {number} cents` and `@returns {string}` (one tag per line) above `formatCents`.
2. Declare `export const Band = /** @type {const} */ ({ STANDARD: "standard", REDUCED: "reduced" });`, the JSDoc form of `as const` (the parentheses are required), add `/** @typedef {(typeof Band)[keyof typeof Band]} BandValue */` and write `@param {BandValue} band`. `describe("zero")` is then error TS2345.
3. `format.js`, then `rates.js`, then `invoice.js`: each file is converted after everything it imports.

## Key takeaways

- `allowJs` lets `tsc` build a mixed codebase; `checkJs` or `// @ts-check` finds bugs in JavaScript as it is.
- JSDoc types JavaScript without changing it; TypeScript 7 applies TypeScript's rules to JSDoc, so values are not types and `@enum` and Closure types are gone.
- Convert files leaves first, separately from behavior changes.
- Start a migration with `"strict": false`, then enable `noImplicitAny`, `strictNullChecks` and the rest one at a time.
- Use `@ts-expect-error` with a reason, and enforce a shrinking budget in CI.

## Further reading

- [Handbook: JS projects utilizing TypeScript](https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html)
- [Handbook: JSDoc reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Handbook: Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [Announcing TypeScript 7.0: JavaScript and JSDoc changes](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
