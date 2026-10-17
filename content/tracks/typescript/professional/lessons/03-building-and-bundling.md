---
title: Building and Bundling
summary: Separate type-checking from producing JavaScript, emit JavaScript, declarations and source maps with tsc, run TypeScript directly with Node's type stripping, and know what a bundler such as esbuild adds and leaves out.
minutes: 35
objectives:
  - Explain the two jobs of a TypeScript build and run each on its own with tsc and tsc --noEmit
  - Read what tsc emits, including declaration files and source maps, and use source maps in stack traces
  - Run TypeScript with Node's type stripping and configure imports so the same code also compiles
  - Decide when a project needs a bundler and set one up so that types are still checked
---

## Outline

1. Two jobs: checking and emitting
2. Emitting with `tsc`
3. Source maps
4. Running TypeScript with Node's type stripping
5. Bundlers
6. Declaration output
7. Choosing a build

## Two jobs: checking and emitting

A TypeScript build does two separate things. **Type-checking** reads every file and reports errors. **Emitting** writes JavaScript that a runtime can execute, plus optional extras. `tsc` does both by default; `tsc --noEmit` only checks. Many production setups split the jobs: a fast tool turns each file into JavaScript without looking at types, and `tsc --noEmit` runs in CI and the editor to keep the types honest. Keep that split in mind: every tool in this lesson except `tsc` skips the checking.

The example project computes bus fares:

```ts
export type Zone = "inner" | "outer";

export interface Trip {
  zones: readonly Zone[];
  minutes: number;
}

export function fareCents(trip: Trip): number {
  if (trip.minutes < 0) {
    throw new RangeError(`minutes must not be negative, got ${trip.minutes}`);
  }
  const base = trip.zones.includes("outer") ? 320 : 240;
  return trip.minutes > 90 ? base * 2 : base;
}
```

`src/main.ts` imports it with `import { fareCents, type Trip } from "./fare.ts";` and prints the fare of three trips, the last of which has negative minutes.

## Emitting with `tsc`

The config emits into `dist` with declarations and source maps, and lets imports name the `.ts` file:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "types": ["node"],
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "sourceMap": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "rewriteRelativeImportExtensions": true
  }
}
```

```console
$ tsc
$ ls dist
fare.d.ts
fare.js
fare.js.map
main.d.ts
main.js
main.js.map
$ cat dist/main.js
import { fareCents } from "./fare.js";
const trips = [
    { zones: ["inner"], minutes: 25 },
    { zones: ["inner", "outer"], minutes: 120 },
    { zones: ["outer"], minutes: -5 },
];
for (const trip of trips) {
    console.log(fareCents(trip));
}
//# sourceMappingURL=main.js.map
```

Three things happened. The types are gone: `Trip[]` and the `type Trip` import vanished, because JavaScript has no types. **`rewriteRelativeImportExtensions`** rewrote `"./fare.ts"` to `"./fare.js"`, the file that exists after the build. And the last line points at the source map. Nothing was converted to older JavaScript, because `target` defaults to `es2025` and Node.js 26 runs all of it.

## Source maps

A **source map** (`.js.map`) records which position in the emitted JavaScript came from which position in the TypeScript. Without it, a crash points into `dist`:

```console
$ node dist/main.js
240
640
RangeError: minutes must not be negative, got -5
    at fareCents (file:///tmp/w/dist/fare.js:3:15)
    at file:///tmp/w/dist/main.js:8:17
```

With `--enable-source-maps`, Node reads the maps and reports the lines you wrote:

```console
$ node --enable-source-maps dist/main.js
240
640
RangeError: minutes must not be negative, got -5
    at fareCents (/tmp/w/src/fare.ts:10:11)
    at <anonymous> (/tmp/w/src/main.ts:9:15)
```

(Node also prints the failing source line above the error and its own frames below; only the error and your frames are shown here.) Ship source maps with services and start them with `--enable-source-maps` or `NODE_OPTIONS=--enable-source-maps`, so production errors name real files and lines.

## Running TypeScript with Node's type stripping

Node.js 26 runs `.ts` files directly. Its **type stripping** replaces every type annotation with spaces and runs what is left. It is stable, needs no flag, and keeps line numbers correct without source maps:

```console
$ node src/main.ts
240
640
RangeError: minutes must not be negative, got -5
    at fareCents (file:///tmp/w/src/fare.ts:10:11)
```

The rules follow from "replace types with spaces":

- **Only erasable syntax.** `enum`, namespaces with values and parameter properties fail with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. Node.js 26 has no flag to transform them. `erasableSyntaxOnly` reports them at compile time.
- **Real file names in imports.** Node loads exactly the path you write. Importing `"./fare.js"` from `src/main.ts` fails with `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/tmp/w/src/fare.js' imported from /tmp/w/src/main.ts`. Write `"./fare.ts"`, and let `rewriteRelativeImportExtensions` fix the emitted files. Without that option (or `allowImportingTsExtensions` with `noEmit`), `tsc` refuses the import: `error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.`
- **`import type` for types**, which `verbatimModuleSyntax` enforces.
- **No `tsconfig.json`.** Node ignores it, so `paths` does nothing. Use subpath imports instead.
- **No type-checking at all.** A file declaring `const minutes: number = "ten";` runs and prints `ten`; only `tsc` reports `error TS2322: Type 'string' is not assignable to type 'number'.`

Type stripping suits scripts, tools and services you deploy as source, with `tsc --noEmit` in CI. Node also refuses to strip types in files under `node_modules`, so packages must still ship JavaScript.

## Bundlers

A **bundler** follows the imports from an entry file and writes one file (or a few) containing all the code, optionally minified, with unused exports removed. Browsers need this, and a bundled service is one file to deploy. **esbuild** is a common choice; Vite and Rollup are others. From esbuild's documentation:

```console
$ npm install --save-exact --save-dev esbuild
$ npx esbuild src/main.ts --bundle --platform=node --format=esm --sourcemap --outfile=dist/main.js
```

`--platform=node` keeps Node's built-in modules as imports, and `--packages=external` would also leave npm packages out of the bundle. esbuild reads TypeScript with its own parser, which is why it is unaffected by TypeScript 7 having no programmatic API yet. Two limits matter:

- It **does not type-check**. Its documentation says to run `tsc --noEmit` alongside it.
- It compiles **one file at a time**, so it cannot know whether an imported name is a type. Turn on `isolatedModules` or `verbatimModuleSyntax` so `tsc` rejects code it would get wrong.

Tools that call TypeScript's API, such as webpack's `ts-loader`, keep using TypeScript 6 until TypeScript 7 gets an API, planned for 7.1.

## Declaration output

A library needs `.d.ts` files for its users, and bundlers do not write them. `tsc` can write only declarations with `"emitDeclarationOnly": true` while another tool writes the JavaScript. **`isolatedDeclarations`** goes further: it requires explicit types on everything exported, so any tool could write the `.d.ts` from one file alone:

```ts
export function seatCount(rows: number, perRow: number) {
  return rows * perRow;
}
export const DEFAULT_ROWS = 12;
```

```text
src/index.ts(2,10): error TS9013: Expression type can't be inferred with --isolatedDeclarations.
```

Adding `: number` as the return type fixes it, and the declaration file is:

```ts
export declare function seatCount(rows: number, perRow: number): number;
export declare const DEFAULT_ROWS = 12;
```

## Choosing a build

- **A Node.js service or tool**: run the source with Node's type stripping, or compile with `tsc` into `dist`; check with `tsc --noEmit` either way.
- **A browser app or a single-file deployment**: a bundler for the JavaScript, `tsc --noEmit` for the types.
- **A library**: `tsc` for JavaScript and declarations (lesson 4).

## Common mistakes

- **Trusting a green bundle.** esbuild and Node happily run code with type errors. Run `tsc --noEmit` in CI.
- **Deploying without `--enable-source-maps`**, then reading stack traces full of `dist/*.js` positions.
- **Writing `.js` imports for code Node runs as source**: `ERR_MODULE_NOT_FOUND`. Import the `.ts` file and enable `rewriteRelativeImportExtensions`.

## Practice

1. Which files does `tsc` write for `src/fare.ts` with `declaration` and `sourceMap` on?
2. A teammate runs a service with `node src/server.ts` and wants type errors to fail the deployment. What do you add?
3. Why does esbuild need `isolatedModules` or `verbatimModuleSyntax`, while `tsc` does not?

### Answers

1. `dist/fare.js`, `dist/fare.js.map` and `dist/fare.d.ts`.
2. A `tsc --noEmit` step in the pipeline before deploying, since Node only strips types and never checks them.
3. esbuild compiles each file alone and cannot tell whether an imported name is a type that must be removed. `tsc` sees the whole program. The flags make `tsc` reject the code that a single-file tool would compile wrongly.

## Key takeaways

- Checking and emitting are separate jobs; `tsc --noEmit` checks, and other tools emit without checking.
- `tsc` erases types, rewrites `.ts` imports with `rewriteRelativeImportExtensions`, and can write `.d.ts` and `.js.map` files.
- `--enable-source-maps` turns `dist` positions in stack traces into TypeScript lines.
- Node.js 26 runs erasable TypeScript directly, with real `.ts` import paths and no type-checking.
- Bundlers such as esbuild bundle and strip types but never check them or write declarations.

## Further reading

- [Node.js 26: Modules: TypeScript](https://nodejs.org/docs/latest-v26.x/api/typescript.html)
- [esbuild: TypeScript caveats](https://esbuild.github.io/content-types/#typescript)
- [TSConfig reference: rewriteRelativeImportExtensions](https://www.typescriptlang.org/tsconfig/#rewriteRelativeImportExtensions)
- [TSConfig reference: isolatedDeclarations](https://www.typescriptlang.org/tsconfig/#isolatedDeclarations)
