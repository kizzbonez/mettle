---
title: tsconfig in Depth
summary: Read and write a production tsconfig.json for TypeScript 7, know which defaults changed in TypeScript 6 and 7, add the checks beyond strict that pay for themselves, choose module settings, and recognize the options that are now errors.
minutes: 35
objectives:
  - Explain how tsc finds and reads tsconfig.json, and state the TypeScript 6 and 7 defaults
  - Turn on noUncheckedIndexedAccess and exactOptionalPropertyTypes and fix the errors they report
  - Use verbatimModuleSyntax and erasableSyntaxOnly to keep code safe for single-file tools and Node's type stripping
  - Choose module settings for a Node.js app, a bundled app and a library, and replace removed options
---

## Outline

1. What tsconfig.json controls
2. The defaults of TypeScript 6 and 7
3. The strict family and the checks beyond it
4. Flags for module syntax
5. Module and resolution choices
6. Options that are now errors
7. A production configuration

## What tsconfig.json controls

A project's compiler settings live in **`tsconfig.json`**. Run `tsc` with no file names and the compiler looks for it in the current folder, then in each parent folder, and compiles that project; `tsc -p path/to/tsconfig.json` names one explicitly.

`compilerOptions` says how to check and what to emit. `include` (or `files`) says which files belong to the project; without either, every `.ts` file under the folder is included. `"extends": "./tsconfig.base.json"` starts from a shared config and overrides single options, and `tsc --showConfig` prints the merged result without compiling. Since TypeScript 6, naming files on the command line next to a `tsconfig.json` is error TS5112.

## The defaults of TypeScript 6 and 7

TypeScript 6.0 changed the defaults that a config without an option gets, and TypeScript 7 keeps them:

- `strict` is `true`.
- `module` is `esnext`, and `target` is the latest standard version, `es2025`.
- `types` is `[]`: no `@types` package is loaded unless you list it.
- `rootDir` is the folder that holds `tsconfig.json`.
- `noUncheckedSideEffectImports` is `true`, so `import "./polyfil.js"` with a typo is an error.

The `types` change surprises people moving a Node.js project. A config of just `{}` and a program that reads `process.env`:

```ts
const port = process.env.PORT;
console.log(port);
```

```text
main.ts(1,14): error TS2591: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
```

`@types/node` may be installed, but it is no longer loaded automatically. Add `"types": ["node"]`; listing types also keeps stray `@types` packages from leaking globals into your project.

## The strict family and the checks beyond it

`strict` is a family switch for `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `strictBuiltinIteratorReturn`, `noImplicitThis`, `useUnknownInCatchVariables` and `alwaysStrict`. Future versions may add members, so an upgrade can report new errors in unchanged code.

Two valuable checks are **not** in the family. **`noUncheckedIndexedAccess`** adds `undefined` to the type of an element read by index, from an array or from an index signature, because the index may not exist. **`exactOptionalPropertyTypes`** makes `label?: string` mean "absent or a string", so writing `undefined` into it explicitly is an error:

```ts
const shelves = ["A1", "B2", "C3"];
const first = shelves[0];
console.log(first.toLowerCase());

const stock: Record<string, number> = { bolts: 40 };
const nuts = stock["nuts"];
console.log(nuts + 1);

interface Options {
  label?: string;
}
const options: Options = { label: undefined };
console.log(options);
```

```text
src/main.ts(3,13): error TS18048: 'first' is possibly 'undefined'.
src/main.ts(7,13): error TS18048: 'nuts' is possibly 'undefined'.
src/main.ts(12,7): error TS2375: Type '{ label: undefined; }' is not assignable to type 'Options' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
  Types of property 'label' are incompatible.
    Type 'undefined' is not assignable to type 'string'.
```

Without the flag, `stock["nuts"]` is typed `number` and `nuts + 1` is `NaN` at run time. With it, you handle the miss: `first?.toLowerCase() ?? "no shelves"`. The difference `exactOptionalPropertyTypes` protects is real: `"label" in options` is `true` for `{ label: undefined }`, `Object.keys` lists it, and spreading it over defaults wipes the default.

**When to turn them on.** TypeScript 7's `tsc --init` enables both, so a new project starts with them: keep them. The settings this course's labs use, from basic lesson 2, leave them off to keep beginners' examples short. In an existing codebase, measure first: `tsc --noEmit --noUncheckedIndexedAccess` lists what the flag would report. Most fixes are a check or a `??` default, and index loops (`for (let i = 0; ...)`) often read better as `for...of`, which the flag leaves alone. `exactOptionalPropertyTypes` matters most where "absent" and "`undefined`" mean different things: settings merged with spread, `PATCH` bodies, objects you serialize. Lesson 10 shows how to raise flags one at a time.

Also outside `strict`: `noImplicitOverride` (an overriding method must say `override`), `noFallthroughCasesInSwitch` and `noImplicitReturns`.

## Flags for module syntax

Tools such as esbuild and Node's type stripping (lesson 3) handle one file at a time and never look at types. Three flags keep your code safe for them:

- **`verbatimModuleSyntax`**: an import without `type` is kept in the output and one marked `type` is removed, so a type imported as a value is an error: a single-file tool would keep an import of something that does not exist at run time.
- **`isolatedModules`**: reports code a single-file tool cannot compile correctly. `verbatimModuleSyntax` implies it.
- **`erasableSyntaxOnly`**: allows only TypeScript syntax that can simply be erased. `enum`, namespaces with values and parameter properties generate JavaScript, so they are errors.

```ts
import { Crate, heaviest } from "./shapes.js";

enum Dock {
  North,
  South,
}

class Loader {
  constructor(private readonly dock: Dock) {}
}

const crates: Crate[] = [{ id: "c1", kilograms: 12 }];
console.log(heaviest(crates), new Loader(Dock.North));
```

```text
src/main.ts(1,10): error TS1484: 'Crate' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
src/main.ts(3,6): error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
src/main.ts(9,15): error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
```

The fixes come from the medium level: `import { heaviest, type Crate }`, an `as const` object instead of the enum, and a field assigned in the constructor. Run the original with `node src/main.ts` and Node stops at the enum with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`; the flag reports it at compile time instead.

## Module and resolution choices

`module` says which module system the output uses, and `moduleResolution` how `import` paths are found. Pick by where the code runs:

- **A Node.js app**: `"module": "nodenext"`, which implies `"moduleResolution": "nodenext"` and checks imports exactly as Node resolves them, `.js` extensions included.
- **An app built by a bundler** (Vite, esbuild): `"module": "preserve"` with `"moduleResolution": "bundler"`, which allows imports without extensions.
- **A library**: `nodenext` (or a fixed `node20`), because code that resolves in Node also works in bundlers, but not the other way round (lesson 4).

## Options that are now errors

TypeScript 6 deprecated a set of options and TypeScript 7 removed them. An old config fails fast:

```json
{
  "compilerOptions": {
    "target": "es5",
    "moduleResolution": "node",
    "baseUrl": "./src",
    "downlevelIteration": true,
    "outFile": "bundle.js"
  }
}
```

```text
tsconfig.json(3,15): error TS5108: Option 'target=ES5' has been removed. Please remove it from your configuration.
tsconfig.json(4,25): error TS5108: Option 'moduleResolution=node10' has been removed. Please remove it from your configuration.
tsconfig.json(5,5): error TS5102: Option 'baseUrl' has been removed. Please remove it from your configuration.
  Use '"paths": {"*": ["./src/*"]}' instead.
tsconfig.json(6,5): error TS5102: Option 'downlevelIteration' has been removed. Please remove it from your configuration.
tsconfig.json(7,5): error TS5102: Option 'outFile' has been removed. Please remove it from your configuration.
```

Also removed: `classic` resolution, the `amd`, `umd` and `system` module formats, and setting `esModuleInterop`, `allowSyntheticDefaultImports` or `alwaysStrict` to `false`. Import assertions are written `with { type: "json" }`, not `assert`. Replace the rest with a modern `target`, `nodenext` or `bundler` resolution, `paths` relative to the config, and a bundler instead of `outFile`.

## A production configuration

This is a sound starting point for a Node.js 26 service, and it compiles the fixed example above:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "es2025",
    "lib": ["es2025"],
    "types": ["node"],
    "rootDir": "src",
    "outDir": "dist",
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`strict` is the default, so it is not written. `lib` pins the built-in declarations to the target, and `skipLibCheck` skips checking the `.d.ts` files of packages, which saves time and avoids errors you cannot fix.

## Common mistakes

- **Expecting `@types/node` to load by itself.** Error TS2591 for `process`. Add `"types": ["node"]`.
- **Silencing `noUncheckedIndexedAccess` with `!`.** `shelves[0]!` brings back the crash the flag prevents. Check the value.
- **Importing a type as a value** with `verbatimModuleSyntax`: TS1484. Write `import { type Crate }` or `import type { Crate }`.

## Practice

1. Under `noUncheckedIndexedAccess`, what is the type of `parts[1]` after `const parts = "a,b".split(",")`? Write code that prints the second part or `"none"`.
2. With `exactOptionalPropertyTypes`, how do you declare `label` so that `{ label: undefined }` is allowed?
3. A config has `"module": "nodenext"` and `"baseUrl": "."` with `"paths": { "@lib/*": ["lib/*"] }`. Fix it for TypeScript 7.

### Answers

1. `string | undefined`. `console.log(parts[1] ?? "none");` prints `b`.
2. `label?: string | undefined`. The property may then be absent or hold `undefined`.
3. Remove `baseUrl` and write `"paths": { "@lib/*": ["./lib/*"] }`. Node never reads `paths`; for code Node runs, the medium level's subpath imports (`#/`) also work at run time.

## Key takeaways

- `tsc` finds `tsconfig.json` by walking up from the current folder; `--showConfig` shows the merged settings.
- TypeScript 6 and 7 default to `strict`, `module: esnext`, `target: es2025`, `types: []` and `rootDir` at the config's folder.
- `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` catch bugs `strict` misses; `tsc --init` enables them, and existing code adopts them after measuring.
- `verbatimModuleSyntax` and `erasableSyntaxOnly` keep code compatible with single-file tools and Node's type stripping.
- `target: es5`, `node10` and `classic` resolution, `baseUrl`, `outFile` and `downlevelIteration` are errors in TypeScript 7.

## Further reading

- [TSConfig reference](https://www.typescriptlang.org/tsconfig/)
- [Announcing TypeScript 6.0: default changes and deprecations](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [Modules: choosing compiler options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html)
