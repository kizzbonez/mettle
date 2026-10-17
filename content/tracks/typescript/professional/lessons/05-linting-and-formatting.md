---
title: Linting and Formatting
summary: Catch the bugs the compiler allows with ESLint and typescript-eslint's typed rules, run them on TypeScript 6 while TypeScript 7 has no API, leave layout to a formatter, and make CI run every check on every change.
minutes: 30
objectives:
  - Explain what a linter finds that tsc does not, with a floating promise as the example
  - Configure ESLint with typescript-eslint and typed linting through the project service
  - Set up the TypeScript 6 alias that typed linting needs next to TypeScript 7's compiler
  - Format with Prettier and run type-checking, linting, formatting and tests in CI
---

## Outline

1. What the compiler allows
2. ESLint and typescript-eslint
3. Typed linting
4. TypeScript 7 and the TypeScript 6 alias
5. Formatting
6. Running every check in CI

## What the compiler allows

`tsc` answers one question: are the types consistent? Plenty of type-correct code is still wrong. This program compiles without a single error:

```ts
async function saveReading(celsius: number): Promise<void> {
  if (Number.isNaN(celsius)) {
    throw new Error("reading is not a number");
  }
  console.log(`saved ${celsius}`);
}

function onReading(raw: string): void {
  saveReading(Number(raw));
  console.log(`queued ${raw}`);
}

onReading("21.5");
onReading("n/a");
```

```text
saved 21.5
queued 21.5
queued n/a
/tmp/work/main.ts:3
    throw new Error("reading is not a number");
          ^

Error: reading is not a number
    at saveReading (/tmp/work/main.ts:3:11)
    at onReading (/tmp/work/main.ts:9:3)
```

`onReading` calls an async function and drops the promise it returns: a **floating promise**. Nobody awaits it, so nobody handles its rejection, and Node.js ends the whole process on an unhandled rejection. Note the order: `queued n/a` printed first, because the caller carried on as if the save had succeeded. The types are fine. The bug is in how the value is used, and that is a linter's job.

## ESLint and typescript-eslint

A **linter** reads code and reports patterns that are likely bugs or break a team's rules. **ESLint** is the standard linter for JavaScript. **typescript-eslint** lets it parse TypeScript and adds rules that understand TypeScript. Its getting-started guide installs and configures it like this:

```console
$ npm install --save-dev eslint @eslint/js typescript typescript-eslint
$ npx eslint .
```

The configuration lives in `eslint.config.mjs` at the project root. It is a JavaScript module, so configuration can be computed, but most projects only combine shared configs:

```js
// @ts-check

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["**/*.{js,ts}"],
  extends: [js.configs.recommended, tseslint.configs.recommended],
});
```

`recommended` holds rules that need only the syntax of each file, such as banning `any` written explicitly or `@ts-ignore` comments. They are fast, but they cannot know that `saveReading(...)` returns a promise. Knowing that requires types.

## Typed linting

**Typed linting** gives rules access to TypeScript's type checker. Switch to the `recommendedTypeChecked` config and turn on the **project service**, which finds the `tsconfig.json` for each file the way an editor does:

```js
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["**/*.{js,ts}"],
  extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
});
```

Now the floating promise is reported by `@typescript-eslint/no-floating-promises`:

```console
$ npx eslint src
/home/dev/thermo/src/sensor.ts
  9:3  error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator  @typescript-eslint/no-floating-promises

✖ 1 problem (1 error, 0 warnings)
```

The fix is to make `onReading` async and `await` the call inside `try`/`catch`, or to attach `.catch(...)` with a handler. Writing `void saveReading(...)` silences the rule, but the rule's own documentation points out that `void` does not handle the rejection: use it only for promises that cannot fail.

Other typed rules in `recommendedTypeChecked` that earn their place:

- `no-misused-promises`: a promise where a condition or a `void` callback is expected, such as `if (isReady())` when `isReady` is async.
- `await-thenable`: `await` on something that is not a promise.
- the `no-unsafe-*` family: values of type `any` (for example from `JSON.parse`) flowing into typed code, where they silently switch checking off.

`strictTypeChecked` adds stricter rules. Typed rules cost time, a few seconds on small projects and more on large ones, which the typescript-eslint team considers well worth it.

## TypeScript 7 and the TypeScript 6 alias

Typed linting calls TypeScript's programmatic API. TypeScript 7.0 ships the native compiler without one (a new API is planned for 7.1), and typescript-eslint supports TypeScript up to 6.0: its maintainers say there is nothing they can do until TypeScript 7 provides an API. The TypeScript team's answer is to install both versions side by side. The `@typescript/typescript6` package re-exports the 6.0 API and provides a `tsc6` command, so an npm **alias** keeps it under the name `typescript` that ESLint plugins import, while TypeScript 7 is installed under another name and still provides `tsc`:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

`npx tsc` then runs TypeScript 7 for builds and type-checking, and typed lint rules run on TypeScript 6. Both read the same `tsconfig.json`, and TypeScript 7 aims to accept any code that 6.0 accepts without deprecated options, so the two agree. Editor plugins for embedded languages such as Vue or Svelte templates are in the same position.

## Formatting

Where to break lines and whether to use semicolons are **formatting** questions, and arguing about them in code review wastes time. A **formatter** rewrites files into one consistent layout. Prettier is the common choice; its documentation recommends pinning an exact version, because a new version may format differently:

```console
$ npm install --save-dev --save-exact prettier
$ node --eval "fs.writeFileSync('.prettierrc','{}\n')"
$ npx prettier . --write
$ npx prettier . --check
```

`--write` formats files; `--check` only reports unformatted ones, which is what CI runs. Let the formatter own layout and the linter own correctness: `eslint-config-prettier` turns off any ESLint rules that would fight Prettier.

## Running every check in CI

Checks only protect code if they run on every change. A `package.json` script gives developers and CI one command:

```json
{
  "scripts": {
    "check": "tsc -b && eslint . --max-warnings 0 && prettier . --check",
    "test": "node --test"
  }
}
```

`--max-warnings 0` makes warnings fail the run, so they do not pile up. A GitHub Actions workflow runs the same steps on every push and pull request:

```yaml
name: checks
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 26
      - run: npm ci
      - run: npm run check
      - run: npm test
```

`npm ci` installs exactly what the lockfile says, so CI checks the same dependency versions you tested with. Make the workflow a required status check on the main branch, so nothing merges red.

## Common mistakes

- **Silencing instead of fixing.** `// eslint-disable-next-line` above every report hides the bugs the rule found. Allow disables only with a reason written next to them.
- **Typed rules without type information.** `recommendedTypeChecked` without `projectService` makes ESLint stop with an error asking for parser services. Turn the project service on.
- **Installing TypeScript 7 as `typescript` with typescript-eslint.** Its supported range ends below 6.1, so typed linting breaks. Use the alias.
- **Formatting rules in ESLint and Prettier at once**, which rewrite each other's output. Add `eslint-config-prettier`.

## Practice

1. Rewrite `onReading` so that a bad reading is logged with `console.error` instead of crashing the process.
2. Which preset reports a floating promise: `recommended` or `recommendedTypeChecked`? Why?
3. A project runs `tsc -b` with TypeScript 7 and wants typed linting. What goes into `devDependencies`?

### Answers

1. ```ts
   async function onReading(raw: string): Promise<void> {
     try {
       await saveReading(Number(raw));
       console.log(`queued ${raw}`);
     } catch (error) {
       console.error(`dropped ${raw}:`, error instanceof Error ? error.message : error);
     }
   }
   ```
   Its callers must now handle the promise too, for example with `await onReading("n/a")` at the top level.
2. `recommendedTypeChecked`. Knowing that a call returns a promise needs the type checker.
3. `"@typescript/native": "npm:typescript@^7.0.2"`, `"typescript": "npm:@typescript/typescript6@^6.0.2"`, plus `eslint`, `@eslint/js` and `typescript-eslint`.

## Key takeaways

- A linter finds type-correct bugs; a floating promise is the classic one.
- typescript-eslint's typed rules use the type checker through `projectService: true`.
- TypeScript 7 has no programmatic API yet, so typed linting runs on TypeScript 6 through the `@typescript/typescript6` alias while `tsc` is TypeScript 7.
- A pinned formatter owns layout; `eslint-config-prettier` keeps the tools apart.
- CI runs `npm ci`, type-checking, linting, `prettier --check` and tests on every change.

## Further reading

- [typescript-eslint: Getting started](https://typescript-eslint.io/getting-started)
- [typescript-eslint: Linting with type information](https://typescript-eslint.io/getting-started/typed-linting)
- [typescript-eslint: no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/)
- [Prettier: Install](https://prettier.io/docs/install)
