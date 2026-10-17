---
title: Decorators
summary: Write standard ECMAScript decorators for methods, accessors and fields, use the context object and decorator factories, attach metadata with Symbol.metadata, and know how they differ from the old experimental decorators and why Node.js needs them compiled.
minutes: 35
objectives:
  - Write a typed method decorator that wraps a method and reads its context
  - Write a decorator factory for an `accessor` field that validates every assignment
  - Record and read class metadata through `context.metadata` and `Symbol.metadata`, with the polyfill it needs
  - Tell standard decorators from `experimentalDecorators`, and explain how they run on Node.js 26
---

## Outline

1. What a decorator is
2. Method decorators and the context object
3. Decorator factories and `accessor`
4. Metadata and `Symbol.metadata`
5. Standard versus experimental decorators
6. Running decorators on Node.js

## What a decorator is

A **decorator** is a function written with `@` in front of a class or a class member. It runs
once, when the class is defined (not when an object is created), and receives two arguments: the
thing being decorated, and a **context object** describing it. It may return a replacement.
Decorators let you add a behavior, such as logging, validation or registration, by labelling the
code instead of repeating it.

TypeScript 5.0 implemented the standard decorators of the ECMAScript proposal, which needs no
compiler option. The old `experimentalDecorators` option still exists for older frameworks, and
section 5 shows the difference.

## Method decorators and the context object

A method decorator receives the original method and returns the function that replaces it:

```ts
function logged<This, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    console.log(`-> ${name}(${args.join(", ")})`);
    const result = method.call(this, ...args);
    console.log(`<- ${name} = ${String(result)}`);
    return result;
  };
}

class Thermostat {
  target = 20;

  @logged
  raise(by: number): number {
    this.target += by;
    return this.target;
  }
}

const hall = new Thermostat();
hall.raise(2);
console.log(hall.target);
```

```text
-> raise(2)
<- raise = 22
22
```

The type parameters let `logged` fit any method while keeping its `this`, parameters and return
type. For a class member, the context object has `kind` (`"method"`, `"getter"`, `"setter"`,
`"field"` or `"accessor"`), `name`, `static`, `private`, `access`, `metadata` and
`addInitializer`, which registers a function to run for each new instance (for a static member
or a class decorator, whose `kind` is `"class"`, once when the class is defined).
TypeScript checks that a decorator fits what it decorates. On a field, appended to the program:

```ts
class Broken {
  @logged
  label = "x";
}
```

```text
main.ts(28,4): error TS1240: Unable to resolve signature of property decorator when called as an expression.
  Argument of type 'undefined' is not assignable to parameter of type '(this: Broken, ...args: unknown[]) => unknown'.
main.ts(28,4): error TS1270: Decorator function return type '(this: Broken, ...args: unknown[]) => unknown' is not assignable to type 'void | ((this: Broken, value: string) => string)'.
  Type '(this: Broken, ...args: unknown[]) => unknown' is not assignable to type '(this: Broken, value: string) => string'.
    Type 'unknown' is not assignable to type 'string'.
```

A field decorator receives `undefined`, because a field has no value until an instance exists;
it may return a function that transforms each instance's initial value.

## Decorator factories and `accessor`

A **decorator factory** is a function that takes options and returns a decorator: `@range(0, 100)`
calls `range` first. The **`accessor`** keyword declares an **auto-accessor**: a field stored in a
hidden private slot behind a getter and a setter. A decorator on it can replace the setter, so it
sees every assignment:

```ts
function range(min: number, max: number) {
  return function <This>(
    target: ClassAccessorDecoratorTarget<This, number>,
    context: ClassAccessorDecoratorContext<This, number>,
  ): ClassAccessorDecoratorResult<This, number> {
    const check = (value: number): number => {
      if (value < min || value > max) {
        throw new RangeError(`${String(context.name)} must be ${min} to ${max}, got ${value}`);
      }
      return value;
    };
    return {
      init: check,
      set(value) {
        target.set.call(this, check(value));
      },
    };
  };
}

class Speaker {
  @range(0, 100) accessor volume = 30;
}

const speaker = new Speaker();
speaker.volume = 80;
console.log(speaker.volume);
try {
  speaker.volume = 120;
} catch (error) {
  console.log(String(error));
}
```

```text
80
RangeError: volume must be 0 to 100, got 120
```

`target` holds the original `get` and `set`; the result may replace them and add `init`, which
checks the initial value. The decorator is typed for `number`, so misuses are caught:

```ts
class Label {
  @range(0, 10) accessor text = "hi";
  @range(0, 10) size = 3;
}
```

```text
main.ts(34,4): error TS1240: Unable to resolve signature of property decorator when called as an expression.
  Argument of type 'ClassAccessorDecoratorTarget<Label, string>' is not assignable to parameter of type 'ClassAccessorDecoratorTarget<Label, number>'.
    Type 'string' is not assignable to type 'number'.
```

The full output repeats this as error TS1270 for the return type, and reports `size` too: a plain
field is not an accessor.

## Metadata and `Symbol.metadata`

Every decorator of a class shares one object, `context.metadata`. After the class is defined,
that object is found at `TheClass[Symbol.metadata]`. Node.js 26 does not define
`Symbol.metadata` yet, and TypeScript only attaches metadata when it exists, so you need two
things: a one-line **polyfill** that runs before any decorated class is defined, and the
`esnext.decorators` library for the type of `Symbol.metadata`, added here with a triple-slash
directive (or in `tsconfig.json` as `"lib": ["es2025", "esnext.decorators"]`):

```ts
// polyfill.ts
(Symbol as { metadata?: symbol }).metadata ??= Symbol("Symbol.metadata");
```

```ts
// main.ts
/// <reference lib="esnext.decorators" />
import "./polyfill.js";

function exported(_value: undefined, context: ClassFieldDecoratorContext): void {
  const fields = (context.metadata.fields ??= []) as string[];
  fields.push(String(context.name));
}

function csvHeader(type: abstract new (...args: never[]) => object): string {
  const fields = type[Symbol.metadata]?.fields ?? [];
  return (fields as string[]).join(",");
}

class Booking {
  @exported guest = "";
  @exported nights = 0;
  internalNote = "";
}

console.log(csvHeader(Booking));
```

```text
guest,nights
```

Imports are evaluated first, so the polyfill runs before `Booking` is defined. Without it,
`context.metadata` is `undefined` at run time even though its type says otherwise, and defining
the class throws:

```text
TypeError: Cannot read properties of undefined (reading 'fields')
```

## Standard versus experimental decorators

Angular, NestJS and older TypeORM code use `"experimentalDecorators": true`, which follows an
earlier draft of the proposal. Those decorators receive `(target, propertyKey, descriptor)`
instead of `(value, context)`, can decorate parameters, and work with `emitDecoratorMetadata`,
which emits parameter types for dependency injection. Standard decorators cannot decorate
parameters and do not support `emitDecoratorMetadata`. Without the flag, an old-style
decorator is rejected:

```ts
function legacy(target: object, key: string, descriptor: PropertyDescriptor): void {}
class Job {
  @legacy
  run(): void {}
}
```

```text
main.ts(3,3): error TS1241: Unable to resolve signature of method decorator when called as an expression.
  The runtime will invoke the decorator with 2 arguments, but the decorator expects 3.
```

Use the style your framework documents; in new code without one, use standard decorators.

## Running decorators on Node.js

JavaScript engines do not run decorators yet. Node.js 26 cannot strip them like types: running
`node main.ts` on the `Thermostat` file stops at `@logged` with
`SyntaxError: Invalid or unexpected token`. Compile with `tsc` first. Decorators are not part of
ES2025, so with `target: es2025` TypeScript rewrites each decorated class into plain JavaScript
with small helper functions (`__esDecorate`, `__runInitializers`), which Node.js runs.

## Common mistakes

- **Expecting a decorator to run per instance.** It runs once per class definition; per-instance
  work goes in `addInitializer` or in the replacement function.
- **Using metadata without the polyfill**, or with a polyfill imported after the class's module.
- **Mixing the two styles.** A decorator written for `experimentalDecorators` does not work as a
  standard one, and the reverse.

## Practice

1. Write `@bound`, a method decorator that uses `addInitializer` to bind the method to each
   instance, so `const handler = button.click; handler()` works.
2. Write `@trimmed`, a field decorator that trims a string field's initial value.

### Answers

```ts
function bound<This, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): void {
  context.addInitializer(function (this: This) {
    const self = this as Record<string | symbol, unknown>;
    self[context.name] = method.bind(this);
  });
}

function trimmed<This>(_value: undefined, _context: ClassFieldDecoratorContext<This, string>) {
  return (initial: string): string => initial.trim();
}

class Clicker {
  @trimmed label = "  Save  ";
  clicks = 0;

  @bound
  click(): string {
    this.clicks += 1;
    return `${this.label} x${this.clicks}`;
  }
}

const button = new Clicker();
const handler = button.click;
console.log(handler(), handler());
```

```text
Save x1 Save x2
```

The initializer runs for each new `Clicker` and stores a bound copy of `click` on the instance.

## Key takeaways

- A decorator runs once when the class is defined, gets the value and a context, and may return
  a replacement.
- Factories take options; an `accessor` decorator can check every assignment.
- `context.metadata` ends up at `Class[Symbol.metadata]`, which Node.js 26 needs polyfilled.
- Standard decorators need no flag; `experimentalDecorators` is a different, older design.
- Node.js cannot strip decorators: compile them with `tsc`.

## Further reading

- [TypeScript 5.0 release notes: Decorators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)
- [TypeScript 5.2 release notes: Decorator Metadata](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)
- [Node.js 26: Modules: TypeScript](https://nodejs.org/docs/latest-v26.x/api/typescript.html)
- [TC39 proposal: Decorators](https://github.com/tc39/proposal-decorators)
