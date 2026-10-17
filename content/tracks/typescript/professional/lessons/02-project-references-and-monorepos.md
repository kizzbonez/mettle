---
title: Project References and Monorepos
summary: Split a codebase into TypeScript projects that build in order with tsc -b, set up composite projects and npm workspaces, share types between packages through declaration files, and use TypeScript 7's parallel build flags.
minutes: 35
objectives:
  - Set up an npm workspace with two packages that depend on each other
  - Write composite tsconfig files with references and a solution-style root config
  - Build with tsc -b, read its verbose output, and explain how it decides what is up to date
  - Fix the errors for a missing composite flag, a file outside include, and an unlinked package
---

## Outline

1. Why split a codebase
2. An npm workspace
3. Composite projects and references
4. Building with `tsc -b`
5. Sharing types between packages
6. TypeScript 7's parallel builds

## Why split a codebase

A **monorepo** is one repository holding several packages: a shared core, a command-line tool, a web service. Compiled as one TypeScript project, every change rechecks everything, the editor loads every file, and nothing stops the core from importing the web service by accident.

**Project references** cut the codebase into smaller TypeScript projects, each with its own `tsconfig.json`. A project lists the projects it depends on, and the compiler builds them in order, rebuilds only what changed, and reads a dependency through its declaration files instead of its source. Boundaries become real: a project can only use what another project exports.

## An npm workspace

npm's **workspaces** let one repository hold several packages that depend on each other without publishing them. The root `package.json` lists the package folders:

```text
harbor/
  package.json            { "private": true, "type": "module", "workspaces": ["packages/*"] }
  tsconfig.base.json
  tsconfig.json
  packages/core/          package.json "@harbor/core", tsconfig.json, src/index.ts
  packages/cli/           package.json "@harbor/cli", tsconfig.json, src/main.ts
```

`packages/cli/package.json` lists `"@harbor/core": "1.0.0"` under `dependencies`. `npm install` at the root finds that the dependency is a workspace and links it instead of downloading it:

```console
$ npm install
added 2 packages in 406ms
$ readlink node_modules/@harbor/core
../../packages/core
```

So `import { fits } from "@harbor/core"` resolves through `node_modules`, for Node and for TypeScript alike, exactly as it would after publishing. `npm run build --workspace=@harbor/cli` runs one package's script, and `npm run test --workspaces --if-present` runs a script in every package that has it.

## Composite projects and references

A project that others reference must set **`composite: true`**, which tells the compiler it can be built on its own and checked quickly. Composite has three rules: `declaration` is on, `rootDir` defaults to the config's folder, and every source file must be matched by `include` or `files`. Shared options go in a base config:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "types": ["node"],
    "composite": true,
    "declarationMap": true,
    "sourceMap": true,
    "verbatimModuleSyntax": true
  }
}
```

Each package extends it. The core needs nothing more than its folders. The CLI adds a **reference** to the core:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

The root `tsconfig.json` is **solution style**: it compiles no files of its own and only lists the projects, so one command builds them all. `"files": []` matters, because otherwise the root would compile every file a second time.

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/cli" }
  ]
}
```

The core's `package.json` points TypeScript and Node at the built files with an `exports` entry: `"types": "./dist/index.d.ts"` and `"default": "./dist/index.js"` under `"."`. Lesson 4 explains `exports` in full.

## Building with `tsc -b`

`tsc -b` (build mode) reads the references, works out the order, and builds each project that is out of date. `--verbose` says why:

```console
$ tsc -b --verbose
11:08:03 AM - Projects in this build: 
    * packages/core/tsconfig.json
    * packages/cli/tsconfig.json
    * tsconfig.json

11:08:03 AM - Project 'packages/core/tsconfig.json' is out of date because output file 'packages/core/tsconfig.tsbuildinfo' does not exist

11:08:03 AM - Building project 'packages/core/tsconfig.json'...

11:08:03 AM - Project 'packages/cli/tsconfig.json' is out of date because output file 'packages/cli/tsconfig.tsbuildinfo' does not exist

11:08:03 AM - Building project 'packages/cli/tsconfig.json'...

$ node packages/cli/dist/main.js
30 m vessel fits B7: true
```

Each project writes a **`.tsbuildinfo`** file, a record of its inputs, outputs and errors. On the next run, a project whose inputs are older than its build info is skipped, so an unchanged build takes a fraction of a second:

```text
11:08:04 AM - Project 'packages/core/tsconfig.json' is up to date because newest input 'packages/core/src/index.ts' is older than output 'packages/core/tsconfig.tsbuildinfo'
```

When the core's public API changes, its new `.d.ts` file makes the CLI out of date, and the break is found at once. Here `fits` gained a third parameter:

```text
11:08:17 AM - Project 'packages/cli/tsconfig.json' is out of date because output 'packages/cli/tsconfig.tsbuildinfo' is older than input 'packages/core/dist/index.d.ts'

11:08:17 AM - Building project 'packages/cli/tsconfig.json'...

packages/cli/src/main.ts(4,46): error TS2554: Expected 3 arguments, but got 2.
```

If the core changes only inside a function body, its `.d.ts` stays the same and the CLI is reported "up to date with .d.ts files from its dependencies": nothing to recheck. Other build flags: `--clean` deletes the outputs, `--force` rebuilds everything, `--dry` shows what would happen, and `--watch` rebuilds on every save. Build mode acts as if `noEmitOnError` were on, so a broken project never leaves outputs that look current. Plain `tsc -p packages/cli` does not build references; use `-b`.

## Sharing types between packages

The CLI imports the core as a package, with types and values in one statement:

```ts
import { fits, type Berth } from "@harbor/core";

const berth: Berth = { id: "B7", lengthMeters: 42 };
console.log(`30 m vessel fits ${berth.id}: ${fits(berth, 30)}`);
```

TypeScript reads `Berth` and `fits` from `packages/core/dist/index.d.ts`, the declaration file the core's build wrote. That file is the contract between the packages: only exported names cross it, so internal helpers stay private. `declarationMap` writes `index.d.ts.map`, which lets "Go to Definition" in the editor jump to the core's `.ts` source instead of the `.d.ts`.

A package that holds only shared types (API shapes, event payloads) is a common pattern: a composite project of `interface` and `type` declarations, referenced by the server and the client, so both sides compile against the same definitions.

## TypeScript 7's parallel builds

TypeScript 7 builds in parallel. `--checkers` sets the number of type-checking workers per project (default 4), and `--builders` sets how many projects build at the same time; the two multiply, so `--checkers 4 --builders 4` can run up to 16 checkers. Independent projects benefit; a chain where each project waits for the previous one does not. `--stopBuildOnErrors` skips the projects downstream of one that failed, and `--singleThreaded` turns parallelism off for debugging.

## Common mistakes

- **Referencing a project that is not composite.** Removing `composite` from the base config gives `error TS6306: Referenced project '/tmp/w/packages/core' must have setting "composite": true.` Keep it in every referenced project.
- **A source file outside `include`.** With `include: ["src"]`, importing `../shared/units.ts` gives `error TS6307: File '/tmp/w/packages/core/shared/units.ts' is not listed within the file list of project '/tmp/w/packages/core/tsconfig.json'. Projects must list all files or use an 'include' pattern.` Move the file into `src` or widen `include`.
- **Forgetting `npm install`.** Without the workspace links, the CLI fails with `error TS2307: Cannot find module '@harbor/core' or its corresponding type declarations.` and Node with `ERR_MODULE_NOT_FOUND`.
- **Leaving out `"files": []`** in the solution config, which compiles everything twice.

## Practice

1. You change a comment inside `fits` in the core and run `tsc -b --verbose`. Which projects are rebuilt?
2. Add a third package, `@harbor/web`, that uses the core. Which files change?
3. Why can the CLI not import `packages/core/src/internal.ts` through `@harbor/core/src/internal.js`?

### Answers

1. The core is rebuilt because its source changed. Its `.d.ts` is unchanged, so the CLI is "up to date with .d.ts files from its dependencies" and only has its timestamps updated.
2. `packages/web/package.json` (with `"@harbor/core": "1.0.0"`), `packages/web/tsconfig.json` (extending the base, referencing `../core`), and the root `tsconfig.json` (a reference to `./packages/web`). Run `npm install` to link it. The root `workspaces` glob already covers the folder.
3. The core's `exports` lists only `"."`, so every other subpath is blocked, for Node and for TypeScript, which reports `error TS2307: Cannot find module '@harbor/core/src/internal.js' or its corresponding type declarations.` Only the declared entry point is public.

## Key takeaways

- npm workspaces link local packages into `node_modules`, so packages import each other by name.
- A referenced project needs `composite: true`; a solution-style root lists the projects with `"files": []`.
- `tsc -b` builds projects in dependency order, skips up-to-date ones using `.tsbuildinfo`, and rechecks dependents when a `.d.ts` changes.
- Declaration files are the contract between packages; `declarationMap` keeps "Go to Definition" on the source.
- TypeScript 7 adds `--builders` and `--checkers` for parallel builds.

## Further reading

- [Handbook: Project references](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TSConfig reference: composite](https://www.typescriptlang.org/tsconfig/#composite)
- [npm docs: Workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces)
- [Announcing TypeScript 7.0: parallel builds](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
