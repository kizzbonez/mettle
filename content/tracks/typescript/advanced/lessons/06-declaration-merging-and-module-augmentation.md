---
title: Declaration Merging and Module Augmentation
summary: See how TypeScript merges declarations that share a name, why ES modules replaced namespaces, and how to add to another module's types or to the global scope with module and global augmentation.
minutes: 30
objectives:
  - Predict the result of merging two interfaces, including methods and conflicting properties
  - Explain why namespaces with values are legacy and why Node's type stripping refuses them
  - Add properties to an interface exported by another module with `declare module`
  - Type `process.env` variables with a global augmentation
---

## Outline

1. Declaration merging
2. Namespaces versus modules
3. Module augmentation
4. Global augmentation
5. What augmentation cannot do

## Declaration merging

A declaration can create a **type** (interfaces, type aliases), a **value** (functions, variables),
or both (classes, enums). When two declarations share a name in the same scope, the compiler may
**merge** them into one definition. The case you meet most is two interfaces:

```ts
interface Toast {
  message: string;
  show(): void;
}
interface Toast {
  seconds: number;
  show(times: number): void;
}

const toast: Toast = {
  message: "Saved",
  seconds: 3,
  show(times?: number) {
    console.log(`${this.message} (${this.seconds}s) x${times ?? 1}`);
  },
};
toast.show();
toast.show(2);
```

```text
Saved (3s) x1
Saved (3s) x2
```

`Toast` has all three properties. The two `show` methods became overloads of one method, with
the later declaration's signatures placed first. A property declared twice must have the same
type both times. The misuses, appended:

```ts
interface Toast {
  seconds: string;
}
const quiet: Toast = { message: "Hi", show() {} };
```

```text
main.ts(20,3): error TS2717: Subsequent property declarations must have the same type.  Property 'seconds' must be of type 'number', but here has type 'string'.
main.ts(22,7): error TS2741: Property 'seconds' is missing in type '{ message: string; show(): void; }' but required in type 'Toast'.
```

Type aliases never merge: a second `type Toast` is a duplicate identifier. That difference is one
reason libraries describe extensible shapes with `interface`.

## Namespaces versus modules

Before JavaScript had modules, TypeScript grouped code in **namespaces**:
`namespace Units { export const cmPerInch = 2.54; }` compiles to an object built by a function
that runs at once, and namespaces of the same name merge. ES modules now do the same job with
files, `import` and `export`, and every tool understands them. Namespaces that contain values are
TypeScript-only syntax with run-time output, so Node.js refuses them when it runs a `.ts` file by
stripping types. It prints the offending code, then:

```console
$ node main.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript namespace declaration is not supported in strip-only mode
```

Write modules. You still read namespaces in declaration files, where they only hold types: the
`NodeJS` namespace of `@types/node` is one, and section 4 adds to it. To give a function extra
properties, the old trick was to merge a namespace into it; today you assign them directly
(`label.prefix = "> "` after `function label`), and TypeScript adds them to the function's type.

## Module augmentation

Modules do not merge with each other. To add to an interface that another module exports, a
file **augments** that module with `declare module "specifier" { ... }`, using the same specifier
an `import` would use. This is how plugins extend a library's types. Here `settings.ts` plays the
library, and a dark-mode plugin adds its own setting:

```ts
// settings.ts
export interface Settings {
  language: string;
}

const values = new Map<string, unknown>([["language", "en"]]);

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  values.set(key, value);
}

export function getSetting<K extends keyof Settings>(key: K): Settings[K] | undefined {
  return values.get(key) as Settings[K] | undefined;
}
```

```ts
// dark-mode.ts
import { setSetting } from "./settings.js";

declare module "./settings.js" {
  interface Settings {
    darkMode: boolean;
  }
}

export function enableDarkMode(): void {
  setSetting("darkMode", true);
}
```

```ts
// main.ts
import { getSetting, setSetting } from "./settings.js";
import { enableDarkMode } from "./dark-mode.js";

enableDarkMode();
setSetting("language", "pt");
console.log(getSetting("language"), getSetting("darkMode"));
```

```text
pt true
```

The augmentation merges into `Settings` as if it were written in `settings.ts`, so `keyof
Settings` is now `"language" | "darkMode"` everywhere in the program, and `setSetting` checks
the value's type for the new key too. The misuses, appended to `main.ts`:

```ts
setSetting("darkMode", "yes");
getSetting("fontSize");
```

```text
main.ts(7,24): error TS2345: Argument of type 'string' is not assignable to parameter of type 'boolean'.
main.ts(8,12): error TS2345: Argument of type '"fontSize"' is not assignable to parameter of type 'keyof Settings'.
```

The augmentation lives in a module file. With `module: nodenext` in a package whose
`package.json` says `"type": "module"`, as in these labs, every `.ts` file is a module, even one
without `import` or `export`.

## Global augmentation

Inside a module, `declare global { ... }` adds to the global scope. A practical use is typing the
environment variables your program reads. `@types/node` declares `process.env` as
`NodeJS.ProcessEnv`, an interface whose index signature gives every name the type
`string | undefined`. Merging a property into it narrows one variable:

```ts
// env.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_MODE?: "development" | "production";
    }
  }
}

export function appMode(): "development" | "production" {
  return process.env.APP_MODE ?? "development";
}
```

```ts
// main.ts
import { appMode } from "./env.js";

console.log(appMode(), process.env.APP_MODE === "production");
```

```text
development false
```

A typo in a comparison is now caught. Appended to `main.ts`:

```ts
if (process.env.APP_MODE === "prod") console.log("live");
```

```text
main.ts(4,5): error TS2367: This comparison appears to be unintentional because the types '"development" | "production" | undefined' and '"prod"' have no overlap.
```

The type is a promise, not a check: nothing stops someone from starting the program with
`APP_MODE=staging`. Validate such values once at start-up, as the medium level did with JSON.

## What augmentation cannot do

An augmentation only describes. Merging a property into an interface changes no object, and
declaring a new export compiles but creates nothing:

```ts
declare module "./settings.js" {
  export function reset(): void;
}
import { reset } from "./settings.js";
reset();
```

```text
/tmp/work/main.ts:4
import { reset } from "./settings.js";
         ^
SyntaxError: The requested module './settings.js' does not provide an export named 'reset'
```

The program type-checked and then failed, with a stack trace, as Node.js linked the modules. The handbook's rule is
to augment only to patch declarations that exist; default exports cannot be augmented at all.

## Common mistakes

- **A specifier that does not resolve.** Write exactly what you would import. `declare module
  "settings-lib"` with no such module is error TS2664, "Invalid module name in augmentation,
  module 'settings-lib' cannot be found."
- **Adding methods to built-ins** with `declare global { interface Array<T> { ... } }` and a
  prototype assignment. Every other library sees them; write a function instead.
- **Treating a typed `process.env` as validated.** It still contains whatever the shell passed.

## Practice

1. Write a second plugin, `font-size.ts`, that adds `fontSize: number` to `Settings` and exports
   `setFontSize(size: number)`.
2. Type a `LOG_LEVEL` variable that may be `"debug"` or `"info"`, defaulting to `"info"`.

### Answers

```ts
// font-size.ts
import { setSetting } from "./settings.js";

declare module "./settings.js" {
  interface Settings {
    fontSize: number;
  }
}

export function setFontSize(size: number): void {
  setSetting("fontSize", size);
}
```

```ts
// env.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LOG_LEVEL?: "debug" | "info";
    }
  }
}

export function logLevel(): "debug" | "info" {
  return process.env.LOG_LEVEL ?? "info";
}
```

With `setFontSize(14)` and `console.log(getSetting("fontSize"), logLevel())` in `main.ts`, the
program prints `14 info`. Both plugins can augment `Settings`; their properties all merge.

## Key takeaways

- Interfaces with the same name merge; methods become overloads, properties must agree.
- Namespaces with values are legacy and not erasable; use ES modules.
- `declare module "specifier"` inside a module adds to that module's interfaces.
- `declare global` adds to global types, such as `NodeJS.ProcessEnv`; types never validate data.

## Further reading

- [TypeScript Handbook: Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [TypeScript Handbook: Namespaces and Modules](https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html)
- [Node.js 26: Modules: TypeScript](https://nodejs.org/docs/latest-v26.x/api/typescript.html)
