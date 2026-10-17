---
title: Conditional Types and infer
summary: Write types that choose between two results, pull parts out of other types with infer, rebuild ReturnType, Parameters and Awaited yourself, and predict when a conditional type distributes over a union.
minutes: 35
objectives:
  - "Read and write a conditional type `T extends U ? X : Y`, including nested ones"
  - Use `infer` to extract an element, a tuple member, a return type or a promise's value
  - Rebuild `ReturnType`, `Parameters`, `Exclude` and a simple `Awaited`
  - Predict when a conditional type distributes over a union, and turn distribution off
---

## Outline

1. A type that chooses
2. The true branch knows more
3. `infer`: pulling a type out
4. Rebuilding `ReturnType`, `Parameters` and `Awaited`
5. Distribution over unions
6. Turning distribution off

## A type that chooses

A **conditional type** has the form `T extends U ? X : Y`. If `T` is assignable to `U`, the type
is `X`; otherwise it is `Y`. It reads like the conditional operator from the basic course, but
it runs in the compiler, on types:

```ts
type InputKind<T> = T extends string ? "text" : T extends number ? "number" : "checkbox";

const nameField: InputKind<string> = "text";
const consentField: InputKind<boolean> = "checkbox";

function inputKind<T extends string | number | boolean>(value: T): InputKind<T> {
  if (typeof value === "string") return "text" as InputKind<T>;
  if (typeof value === "number") return "number" as InputKind<T>;
  return "checkbox" as InputKind<T>;
}

const ageKind = inputKind(42);
console.log(nameField, consentField, ageKind);
```

```text
text checkbox number
```

Conditional types nest like `else if`. Called with `42`, `T` is `42`, so the result type is
`"number"`. Two misuses appended to the program:

```ts
const wrong: InputKind<number> = "text";
const ageText: "text" = ageKind;
```

```text
main.ts(14,7): error TS2322: Type '"text"' is not assignable to type '"number"'.
main.ts(15,7): error TS2322: Type '"number"' is not assignable to type '"text"'.
```

Why the `as` casts? Inside `inputKind`, `T` is not known yet, so `InputKind<T>` cannot be
resolved, and checking `typeof value` does not change `T`. Without the casts, every `return` is
error TS2322, `Type '"text"' is not assignable to type 'InputKind<T>'.` Implementations of
conditional return types need a cast (or overloads, in lesson 5); keep them small and tested.

## The true branch knows more

In the true branch, TypeScript knows that `T` matched the pattern, so it may use what the pattern
promises. That is how you index a type safely:

```ts
type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;
type ElementOf<T> = T extends readonly (infer Item)[] ? Item : T;
type First<T extends readonly unknown[]> = T extends readonly [infer Head, ...unknown[]] ? Head : undefined;

const fromError: MessageOf<Error> = "disk full";
const element: ElementOf<boolean[]> = true;
const notArray: ElementOf<Date> = new Date(0);
const head: First<["GET", "/users"]> = "GET";
console.log(fromError, element, notArray.getTime(), head);
```

```text
disk full true 0 GET
```

`MessageOf<Error>` is `string`, because `Error` has a `message: string`. The misuses:

```ts
const fromNumber: MessageOf<number> = 5;
const tail: First<["GET", "/users"]> = "/users";
type Unchecked<T> = T["message"];
```

```text
main.ts(10,7): error TS2322: Type '5' is not assignable to type 'never'.
main.ts(11,7): error TS2322: Type '"/users"' is not assignable to type '"GET"'.
main.ts(12,21): error TS2536: Type '"message"' cannot be used to index type 'T'.
```

`never` is the empty type: no value belongs to it, so the false branch of `MessageOf` makes any
use with a type that has no `message` fail. And `T["message"]` without the condition is rejected,
because a plain `T` may not have that key.

## `infer`: pulling a type out

`ElementOf` and `First` above used **`infer`**. Inside the pattern after `extends`, `infer Item`
declares a new type variable, and the compiler fills it with whatever part of `T` stands in that
place. It can only be used in the true branch. Read
`T extends readonly (infer Item)[] ? Item : T` as "if `T` is an array of something, call that
something `Item` and give it back; otherwise give back `T`". `First` matches a tuple whose first
member is `Head`, followed by anything; an empty tuple fails the pattern and gives `undefined`.

## Rebuilding `ReturnType`, `Parameters` and `Awaited`

The utility types from the medium level are conditional types with `infer`. You can write them
yourself:

```ts
type MyReturnType<F extends (...args: never[]) => unknown> = F extends (...args: never[]) => infer R ? R : never;
type MyParameters<F extends (...args: never[]) => unknown> = F extends (...args: infer P) => unknown ? P : never;
type MyAwaited<T> = T extends PromiseLike<infer V> ? MyAwaited<V> : T;

async function loadUser(id: number, withPosts: boolean): Promise<{ id: number; posts: string[] }> {
  return { id, posts: withPosts ? ["hello"] : [] };
}

type LoadResult = MyReturnType<typeof loadUser>;
type LoadArgs = MyParameters<typeof loadUser>;
type User = MyAwaited<LoadResult>;

const args: LoadArgs = [7, true];
const user: User = await loadUser(...args);
console.log(user);

const nested: MyAwaited<Promise<Promise<string>>> = "deep";
console.log(nested);
```

```text
{ id: 7, posts: [ 'hello' ] }
deep
```

`LoadArgs` is the tuple `[id: number, withPosts: boolean]`, and `MyAwaited` calls itself until
the type is no longer a promise: a **recursive** conditional type. `never[]` as the parameter
pattern accepts every function, because any parameter type can receive `never`. The misuses:

```ts
type NotAFunction = MyReturnType<string>;
const partial: User = { id: 7 };
```

```text
main.ts(19,34): error TS2344: Type 'string' does not satisfy the constraint '(...args: never[]) => unknown'.
main.ts(20,7): error TS2741: Property 'posts' is missing in type '{ id: number; }' but required in type '{ id: number; posts: string[]; }'.
```

The built-in `Awaited` also handles `null`, `undefined` and objects with a `then` method. For an
overloaded function, `ReturnType` uses the **last** overload signature.

## Distribution over unions

When the checked type is a bare type parameter and you pass a union, the conditional type is
applied to each member separately and the results are joined: it is **distributive**.

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type ToArrayWhole<T> = [T] extends [unknown] ? T[] : never;
type MyExclude<T, U> = T extends U ? never : T;

type Status = "draft" | "review" | "published" | "archived";

const titles: ToArray<string | number> = ["a", "b"];
const mixed: ToArrayWhole<string | number> = ["a", 1];
const live: MyExclude<Status, "draft" | "archived"> = "review";
console.log(titles, mixed, live);
```

```text
[ 'a', 'b' ] [ 'a', 1 ] review
```

`ToArray<string | number>` is `string[] | number[]`, an array of one kind or the other.
`MyExclude` works only because of distribution: each member that matches `U` becomes `never`, and
`never` vanishes from a union. The misuses:

```ts
const wrongMix: ToArray<string | number> = ["a", 1];
const notLive: MyExclude<Status, "draft" | "archived"> = "draft";
```

```text
main.ts(11,7): error TS2322: Type '(string | number)[]' is not assignable to type 'string[] | number[]'.
  Type '(string | number)[]' is not assignable to type 'string[]'.
    Type 'string | number' is not assignable to type 'string'.
      Type 'number' is not assignable to type 'string'.
main.ts(12,7): error TS2322: Type '"draft"' is not assignable to type '"published" | "review"'.
```

## Turning distribution off

Wrapping both sides in brackets, `[T] extends [unknown]`, makes the checked type a tuple rather
than a bare type parameter, so the union is checked as a whole. `ToArrayWhole<string | number>`
is `(string | number)[]`, which accepts `["a", 1]`.

## Common mistakes

- **Testing for `never` with a distributive type.** `never` is the empty union, so
  `type IsNever<T> = T extends never ? true : false` gives `never` for `IsNever<never>`, and
  `const answer: IsNever<never> = true` is "error TS2322: Type 'true' is not assignable to type
  'never'." Write `[T] extends [never]`.
- **Using an `infer` variable in the false branch**: error TS2304, "Cannot find name 'Item'."
  Outside a conditional type, `infer` is error TS1338, "'infer' declarations are only permitted
  in the 'extends' clause of a conditional type."
- **Expecting `typeof` checks to narrow `T` in a conditional return type.** They narrow the
  value, not `T`: cast, or use overloads.

## Practice

1. Write `NonNull<T>` that removes `null` and `undefined` from a union.
2. Write `FirstArg<F>`, the type of a function's first parameter.
3. Write `DeepElement<T>` so that `DeepElement<number[][][]>` is `number`.

### Answers

```ts
type NonNull<T> = T extends null | undefined ? never : T;
type FirstArg<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;
type DeepElement<T> = T extends readonly (infer Item)[] ? DeepElement<Item> : T;

function greet(name: string, times: number): string {
  return `hi ${name}! `.repeat(times).trim();
}

const id: NonNull<string | null | undefined> = "u-1";
const arg: FirstArg<typeof greet> = "Ada";
const cell: DeepElement<number[][][]> = 9;
console.log(id, greet(arg, 1), cell);
```

```text
u-1 hi Ada! 9
```

`NonNull` relies on distribution, and `DeepElement` on recursion. Appending
`const missing: NonNull<string | null> = null;` gives "error TS2322: Type 'null' is not
assignable to type 'string'."

## Key takeaways

- `T extends U ? X : Y` chooses a type; in the true branch, `T` is known to match `U`.
- `infer` names a part of the matched type, for use in the true branch.
- `ReturnType`, `Parameters`, `Exclude` and `Awaited` are conditional types you can rebuild.
- A bare type parameter distributes over a union; `[T] extends [U]` checks the union whole.

## Further reading

- [TypeScript Handbook: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript reference: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook: Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
