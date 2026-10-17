---
title: Publishing Packages
summary: Publish a TypeScript library that works for every consumer, with an exports map that names its types, declaration files, an exact file list, ESM that CommonJS code can require, a version number that follows semver, and a test of the real tarball before it reaches the registry.
minutes: 35
objectives:
  - Write the package.json fields of a library, including an exports map with a types condition
  - Configure tsc to emit JavaScript, declaration files and maps for a library
  - Explain how ESM and CommonJS consumers load an ESM package on Node.js 26 and in TypeScript
  - Check a package before publishing with npm pack and a test install, and pick the right semver bump
---

## Outline

1. What gets published
2. The package.json of a library
3. Compiling the library
4. Checking the tarball
5. ESM and CommonJS consumers
6. Semantic versioning for types
7. Publishing

## What gets published

Publishing uploads a **tarball**, a compressed archive of your package folder, to the npm registry. Consumers install that tarball, not your repository, so what matters is exactly which files it contains and what `package.json` tells Node and TypeScript about them. Users get JavaScript to run and declaration files (`.d.ts`) for their compiler and editor. Node refuses to strip types inside `node_modules`, so a package never ships only `.ts` files.

The example library computes the gradient of hiking trail segments.

## The package.json of a library

```json
{
  "name": "trail-grade",
  "version": "1.2.0",
  "description": "Gradients and climbing effort for hiking trails",
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "engines": { "node": ">=22.12" },
  "scripts": {
    "build": "tsc",
    "prepack": "npm run build"
  }
}
```

- **`type: "module"`** makes the `.js` files ES modules.
- **`exports`** is the public surface. Each key is a path consumers may import (`"."` is the package name itself) and each value maps **conditions** to files. Conditions are tried in order and the first match wins: `"types"` is the file TypeScript reads, `"default"` the file everyone else loads. Put `"types"` first, so nothing earlier can win for TypeScript. A path that is not listed cannot be imported, which keeps internals private.
- **`files`** is the allow list of what goes into the tarball. `package.json`, the README and the LICENSE are always included.
- **`engines`** documents the Node.js versions you support; npm only warns when it does not match.
- **`prepack`** runs before packing and publishing, so a stale `dist` is never shipped.

A package with `"private": true`, such as a monorepo root, can never be published by accident.

## Compiling the library

A library's `tsconfig.json` emits JavaScript, declarations and maps:

```json
{
  "compilerOptions": {
    "module": "node20",
    "target": "es2023",
    "types": [],
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rootDir": "src",
    "outDir": "dist"
  }
}
```

`module: "node20"` checks imports with Node's resolution rules, which also satisfy bundlers. `target` is set to the oldest JavaScript your supported runtimes understand, not the latest, because consumers may run older versions than you. `types: []` keeps Node's globals out of a library that should not depend on them. `strict` stays on (the default): a library compiled loosely can publish types that break consumers who compile strictly.

## Checking the tarball

`npm pack --dry-run` runs `prepack`, builds the tarball in memory and lists it:

```text
npm notice Tarball Contents
npm notice 173B dist/index.d.ts
npm notice 233B dist/index.d.ts.map
npm notice 150B dist/index.js
npm notice 249B dist/index.js.map
npm notice 70B dist/internal/helpers.d.ts
npm notice 149B dist/internal/helpers.d.ts.map
npm notice 60B dist/internal/helpers.js
npm notice 157B dist/internal/helpers.js.map
npm notice 434B package.json
```

No `src`, no tests, no `tsconfig.json`. The internal helpers are shipped, because `index.js` may import them, but `exports` makes them unreachable from outside:

```text
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './dist/internal/helpers.js' is not defined by "exports" in /tmp/w/cjs-app/node_modules/trail-grade/package.json
```

The real test is installing the tarball the way a user would. `npm pack` writes `trail-grade-1.2.0.tgz`; a scratch consumer installs it from the file and compiles against it:

```ts
import { gradePercent, type Segment } from "trail-grade";

const ridge: Segment = { meters: 400, climbMeters: 36 };
console.log(`ridge: ${gradePercent(ridge)}%`);
```

```console
$ npm install ../pkg/trail-grade-1.2.0.tgz
added 1 package in 554ms
$ tsc && node dist/main.js
ridge: 9%
```

This catches what tests inside the repository cannot: a missing file in `files`, a wrong path in `exports`, declarations that do not resolve. The **Are the Types Wrong?** tool checks the types under every resolution mode; its documentation runs it as `npx --yes @arethetypeswrong/cli --pack .`.

## ESM and CommonJS consumers

Code written as **CommonJS** uses `require`. Node.js 26 can `require()` an ES module as long as the module has no top-level `await`; the result is the module's namespace object. So a plain CommonJS file works with this ESM-only package:

```console
$ cat main.cjs
const { gradePercent } = require("trail-grade");
console.log(`saddle: ${gradePercent({ meters: 250, climbMeters: 30 })}%`);
$ node main.cjs
saddle: 12%
```

TypeScript models this under `module: nodenext` and `node20`. A CommonJS consumer file, `report.cts`, may import the package, and `tsc` emits a `require` call:

```ts
import { gradePercent } from "trail-grade";

console.log(`saddle: ${gradePercent({ meters: 250, climbMeters: 30 })}%`);
```

With the older `module: node16`, which describes Node versions that could not do this, the same file is rejected:

```text
report.cts(1,30): error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import("trail-grade")' call instead.
```

This is why publishing ESM only is now the usual choice: ESM consumers import it, CommonJS consumers on supported Node versions require it, and `engines` says which versions those are. Publishing two builds (ESM under an `"import"` condition, CommonJS under `"require"`) is still possible, but the TypeScript handbook warns that one type-check cannot prove both outputs correct, and the two copies can disagree at run time. Avoid top-level `await` in a library, because it makes `require()` fail with `ERR_REQUIRE_ASYNC_MODULE`.

## Semantic versioning for types

Packages use **semantic versioning**: `MAJOR.MINOR.PATCH`. PATCH fixes bugs, MINOR adds features compatibly, MAJOR breaks something. In TypeScript, the types are part of the API, so these changes are breaking even if no JavaScript changes:

- removing or renaming an export, or a property of an exported type;
- making a parameter type narrower, or adding a required property to an input interface;
- making a return type wider, for example adding `| undefined`;
- raising `engines.node` or the oldest TypeScript version your declarations need.

Adding an optional parameter, a new export or an optional input property is MINOR. `npm version minor` updates `package.json` (and, in a git repository, commits and tags the release):

```console
$ npm version minor
v1.3.0
```

## Publishing

`npm publish --dry-run` shows what would happen without uploading; `npm publish` uploads after you log in with `npm login`. Publishing from CI is safer than from a laptop: npm's trusted publishing lets a GitHub Actions or GitLab CI workflow publish with short-lived credentials instead of a long-lived token, and for a public repository it adds provenance that links the package to the source and workflow that built it.

## Common mistakes

- **No `"types"` in `exports`** while the declarations live in another folder: consumers get `error TS7016: Could not find a declaration file for module 'trail-grade'.` Name them under `"types"`, first.
- **Forgetting `files`**, which ships tests, fixtures and sometimes secrets, or forgetting `dist` in it, which ships nothing useful. Check with `npm pack --dry-run`.
- **Testing only inside the repository.** Install the packed tarball into a scratch project.
- **A type-only breaking change released as a minor.** Narrowing an exported type breaks consumers' builds.

## Practice

1. Add a public subpath `trail-grade/units` that maps to `dist/units.js` and its declarations.
2. Version 1.3.0 exports `gradePercent(segment: Segment): number`. You change it to return `number | undefined` for zero-length segments. Which version comes next?
3. A consumer's `tsconfig.json` uses `module: node16` and a `.cts` file imports `trail-grade`. What happens, and what are two fixes?

### Answers

1. Add `"./units": { "types": "./dist/units.d.ts", "default": "./dist/units.js" }` to `exports`.
2. 2.0.0. A wider return type breaks callers that use the result as a `number`.
3. Error TS1479. The consumer can switch to `module: nodenext` (or `node20`) and run on a Node version that can `require()` ES modules, or use `await import("trail-grade")`.

## Key takeaways

- The tarball is the product: `files` decides its contents and `exports` its public entry points.
- Put the `"types"` condition first in each `exports` entry, and emit declarations with `declaration: true`.
- Node.js 26 can `require()` synchronous ES modules, and TypeScript allows it under `nodenext` and `node20`, so ESM-only packages serve both.
- Test the packed tarball in a scratch consumer before publishing.
- Type changes are API changes: version them with semver like any other.

## Further reading

- [npm docs: package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json)
- [Node.js 26: Modules: Packages](https://nodejs.org/docs/latest-v26.x/api/packages.html)
- [Node.js 26: Loading ECMAScript modules using require()](https://nodejs.org/docs/latest-v26.x/api/modules.html#loading-ecmascript-modules-using-require)
- [TypeScript Handbook: Choosing compiler options for a library](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html)
