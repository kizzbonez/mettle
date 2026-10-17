---
title: Generics in Depth
summary: Make type parameters depend on each other with keyof, give them defaults, steer inference with context and NoInfer, understand variance and the in and out annotations, and keep literal types with const type parameters.
minutes: 35
objectives:
  - Constrain one type parameter by another with `K extends keyof T` and return `T[K]`
  - Declare default type parameters and predict what inference does when nothing fills them
  - Explain how context and `NoInfer` decide what a type parameter becomes
  - Tell covariant, contravariant and invariant positions apart and read a variance error
  - Use a `const` type parameter to keep literal and tuple types without `as const`
---

## Outline

1. Where the medium level left generics
2. Constraints that use `keyof`
3. Default type parameters
4. Inference from context, and `NoInfer`
5. Variance: when is `Producer<Dog>` a `Producer<Animal>`?
6. `const` type parameters

## Where the medium level left generics

A **type parameter** is a placeholder for a type, filled in at each use. You have written
`function first<T>(items: T[]): T`, constrained parameters with `extends`, and let inference fill
them. This lesson makes type parameters work together. Each type is shown used correctly, then
misused, with the misuse appended to the program and the error TypeScript 7.0.2 prints.

## Constraints that use `keyof`

A type parameter can be constrained by another one. `K extends keyof T` says "K is one of the keys
of whatever T turns out to be", and the **indexed access type** `T[K]` is the type at that key:

```ts
interface Track {
  title: string;
  artist: string;
  seconds: number;
}

function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const playlist: Track[] = [
  { title: "Blue Monday", artist: "New Order", seconds: 448 },
  { title: "Teardrop", artist: "Massive Attack", seconds: 330 },
];

const titles = pluck(playlist, "title");
const lengths = pluck(playlist, "seconds");
console.log(titles, lengths);
```

```text
[ 'Blue Monday', 'Teardrop' ] [ 448, 330 ]
```

`T` is inferred as `Track` from the array, then `K` as `"seconds"` from the key, so `lengths`
is `number[]`, not `(string | number)[]`. Two misuses:

```ts
const albums = pluck(playlist, "album");
const wrong: string[] = lengths;
```

```text
main.ts(19,32): error TS2345: Argument of type '"album"' is not assignable to parameter of type 'keyof Track'.
main.ts(20,7): error TS2322: Type 'number[]' is not assignable to type 'string[]'.
  Type 'number' is not assignable to type 'string'.
```

TypeScript 7 prints the parameter type as `keyof Track` rather than spelling out the keys.

## Default type parameters

A type parameter can have a **default**, used when the caller gives no type argument and
inference finds nothing to fill it:

```ts
interface ApiResult<TData = unknown, TError = string> {
  ok: boolean;
  data?: TData;
  error?: TError;
}

const ping: ApiResult = { ok: true, data: "pong" };
const count: ApiResult<number, { code: number }> = { ok: false, error: { code: 503 } };

function firstOr<T, F = undefined>(items: readonly T[], fallback?: F): T | F {
  return items.length > 0 ? items[0] : (fallback as F);
}

const a = firstOr([4, 8]);
console.log(ping, count, a);
```

```text
{ ok: true, data: 'pong' } { ok: false, error: { code: 503 } } 4
```

`ApiResult` alone means `ApiResult<unknown, string>`. In `firstOr([4, 8])` no argument fills `F`,
so it takes its default and `a` is `number | undefined`. The rules, shown by what they reject:

```ts
const shouted: string = ping.data;
const other: string = a;
interface Broken<TData = unknown, TError> {
  data?: TData;
  error?: TError;
}
interface Limited<T extends string = number> {
  value: T;
}
```

```text
main.ts(16,7): error TS2322: Type 'unknown' is not assignable to type 'string'.
main.ts(17,7): error TS2322: Type 'number | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
main.ts(18,35): error TS2706: Required type parameters may not follow optional type parameters.
main.ts(22,38): error TS2344: Type 'number' does not satisfy the constraint 'string'.
```

## Inference from context, and `NoInfer`

Inference flows both ways. Below, `T` comes from the array; the arrow function then receives a
**contextual type**, so `n` is a `number` without an annotation, and `U` is inferred from what
the arrow returns:

```ts
function mapAll<T, U>(items: readonly T[], transform: (item: T, index: number) => U): U[] {
  return items.map(transform);
}

const labels = mapAll([3, 1, 2], (n, i) => `${i}:${n.toFixed(1)}`);
console.log(labels);

function pickTheme<C extends string>(themes: C[], fallback: NoInfer<C>): C {
  return themes.includes(fallback) ? fallback : themes[0];
}

console.log(pickTheme(["dark", "light"], "light"));
```

```text
[ '0:3.0', '1:1.0', '2:2.0' ]
light
```

Every argument is a **candidate** for inference. Without `NoInfer`, a call with `"sepia"` would be
accepted and `C` widened to `"dark" | "light" | "sepia"`. `NoInfer<C>` (TypeScript 5.4) tells the
compiler not to look inside that parameter, so `C` comes only from `themes`:

```text
main.ts(13,42): error TS2345: Argument of type '"sepia"' is not assignable to parameter of type '"dark" | "light"'.
```

A type parameter used only in the return type, as in `parse<T>(text: string): T`, has nothing to
infer from: `parse("8080")` returns `unknown`.

## Variance: when is `Producer<Dog>` a `Producer<Animal>`?

If `Dog` is assignable to `Animal`, **variance** says what follows for a generic type built from
them. A type that only hands values out is **covariant**: `Producer<Dog>` can stand in for
`Producer<Animal>`. A type that only takes values in is **contravariant**: the direction flips. A
type that does both is **invariant**. TypeScript measures variance from the structure; `out` and
`in` on a type parameter state it, and the compiler checks the statement:

```ts
interface Animal {
  name: string;
}
interface Dog extends Animal {
  bark: () => string;
}
interface Producer<out T> {
  make: () => T;
}
interface Consumer<in T> {
  consume: (value: T) => void;
}

const dogShelter: Producer<Dog> = { make: () => ({ name: "Rex", bark: () => "Woof" }) };
const animalSource: Producer<Animal> = dogShelter;
const animalLogger: Consumer<Animal> = { consume: (a) => console.log(`saw ${a.name}`) };
const dogLogger: Consumer<Dog> = animalLogger;
dogLogger.consume(dogShelter.make());
```

```text
saw Rex
```

A logger for any animal can log a dog. The reverse assignments are rejected, and so is an
annotation that contradicts the structure:

```ts
const dogSource: Producer<Dog> = animalSource;
const anyLogger: Consumer<Animal> = dogLogger;
interface Sink<out T> {
  consume: (value: T) => void;
}
```

```text
main.ts(19,7): error TS2322: Type 'Producer<Animal>' is not assignable to type 'Producer<Dog>'.
  Property 'bark' is missing in type 'Animal' but required in type 'Dog'.
main.ts(20,7): error TS2322: Type 'Consumer<Dog>' is not assignable to type 'Consumer<Animal>'.
  Property 'bark' is missing in type 'Animal' but required in type 'Dog'.
main.ts(21,16): error TS2636: Type 'Sink<sub-T>' is not assignable to type 'Sink<super-T>' as implied by variance annotation.
  Types of property 'consume' are incompatible.
```

The handbook's advice: write `in` or `out` only to state what the structure already says.

## `const` type parameters

Inference normally widens `["/home", "/about"]` to `string[]`, because arrays are usually changed
later. Writing `const` before a type parameter (TypeScript 5.0) asks for the narrow type that
`as const` would give:

```ts
function routes<T extends readonly string[]>(paths: T): T {
  return paths;
}
function routesExact<const T extends readonly string[]>(paths: T): T {
  return paths;
}

const loose = routes(["/home", "/about"]);
const exact = routesExact(["/home", "/about"]);
const third = exact[2];
```

```text
main.ts(10,21): error TS2493: Tuple type 'readonly ["/home", "/about"]' of length '2' has no element at index '2'.
```

`loose` is `string[]`; `exact` is the tuple `readonly ["/home", "/about"]`, so reading a third
element is caught. `const` only affects literals written in the call: passing a variable that
holds the same array still infers `string[]`.

## Common mistakes

- **Supplying some of the type arguments.** There is no partial inference:
  `pluck<Track>(playlist, "title")` is error TS2558, "Expected 2 type arguments, but got 1."
- **Method syntax hides contravariance.** A method written `consume(value: T): void` has its
  parameters checked bivariantly, so `MethodConsumer<Dog>` passes as `MethodConsumer<Animal>`.
  Use a function-typed property: `consume: (value: T) => void`.
- **A mutable constraint on a `const` parameter.** With `const T extends string[]`, a variable
  holding an `as const` array is rejected: "error TS4104: The type 'readonly ["/home"]' is
  'readonly' and cannot be assigned to the mutable type 'string[]'." Use `readonly string[]`.

## Practice

1. Write `setField(item, key, value)` returning a changed copy, so that the value must have the
   type of the key. Is `setField(song, "seconds", "long")` accepted?
2. `Getter<T>` has `get: () => T`; `Setter<T>` has `set: (value: T) => void`. Annotate their
   variance. Can a `Getter<string>` be assigned to a `Getter<"on" | "off">`?
3. Write `tuple(...items)` so that `tuple("volume", 7)` has the type `readonly ["volume", 7]`.

### Answers

```ts
interface Track {
  title: string;
  seconds: number;
}
function setField<T, K extends keyof T>(item: T, key: K, value: T[K]): T {
  return { ...item, [key]: value };
}
interface Getter<out T> {
  get: () => T;
}
interface Setter<in T> {
  set: (value: T) => void;
}
function tuple<const T extends readonly unknown[]>(...items: T): T {
  return items;
}

const song: Track = { title: "Teardrop", seconds: 330 };
const onOff: Getter<"on" | "off"> = { get: () => "on" };
const text: Getter<string> = onOff;
const entry = tuple("volume", 7);
console.log(setField(song, "seconds", 331), text.get(), entry);
```

```text
{ title: 'Teardrop', seconds: 331 } on [ 'volume', 7 ]
```

Appending `setField(song, "seconds", "long");` and `const narrow: Getter<"on" | "off"> = text;`:

```text
main.ts(23,27): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
main.ts(24,7): error TS2322: Type 'Getter<string>' is not assignable to type 'Getter<"off" | "on">'.
```

TypeScript 7 prints union members in a stable order of its own, here `"off" | "on"`.

## Key takeaways

- `K extends keyof T` ties a key to its object; `T[K]` is the type at that key.
- Defaults fill type parameters that neither the caller nor inference fills.
- Every argument is an inference candidate; `NoInfer<T>` removes one.
- Producers are covariant, consumers contravariant; `out` and `in` state it and are checked.
- `const T` keeps literal and tuple types for values written in the call.

## Further reading

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript 5.0 release notes: const type parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)
- [TypeScript 5.4 release notes: the NoInfer utility type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html)
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
