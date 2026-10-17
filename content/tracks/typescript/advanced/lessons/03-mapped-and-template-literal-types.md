---
title: Mapped and Template Literal Types
summary: Build new object types from old ones with mapped types and their readonly and optional modifiers, rename and filter keys with as, compose string types with template literals and Uppercase, and parse strings at the type level with infer.
minutes: 35
objectives:
  - Write a mapped type over `keyof T` and add or remove `readonly` and `?` with `+` and `-`
  - Rename keys with `as` and a template literal, and drop keys by mapping them to `never`
  - Build string types from unions with template literal types and the intrinsic string types
  - Extract parts of a string type with `infer` inside a template literal
---

## Outline

1. Mapped types
2. Modifiers: `readonly` and `?`, added and removed
3. Renaming and filtering keys with `as`
4. Template literal types
5. Parsing strings with `infer`

## Mapped types

The medium level used `Partial<T>` and `Readonly<T>`. They are **mapped types**: a type that walks
through a union of keys and produces one property for each. The syntax
`{ [K in keyof T]: Something }` reads "for each key `K` of `T`, a property `K` of type
`Something`", where `Something` may use `K` and `T[K]`:

```ts
interface SignUp {
  readonly email: string;
  age: number;
  newsletter?: boolean;
}

type Validators<T> = { [K in keyof T]-?: (value: T[K]) => string | null };
type Editable<T> = { -readonly [K in keyof T]: T[K] };

const rules: Validators<SignUp> = {
  email: (value) => (value.includes("@") ? null : "needs an @"),
  age: (value) => (value >= 16 ? null : "must be 16 or over"),
  newsletter: () => null,
};

function validate<T>(input: T, validators: Validators<T>): string[] {
  const problems: string[] = [];
  for (const key of Object.keys(validators) as (keyof T)[]) {
    const problem = validators[key](input[key]);
    if (problem !== null) problems.push(`${String(key)}: ${problem}`);
  }
  return problems;
}

const form: Editable<SignUp> = { email: "ada.example.com", age: 15 };
console.log(validate(form, rules));
form.email = "ada@example.com";
form.age = 36;
console.log(validate(form, rules));
```

```text
[ 'email: needs an @', 'age: must be 16 or over' ]
[]
```

`Validators<SignUp>` has one function per field of the form, each taking that field's type, so
`value.includes` and `value >= 16` are checked against `string` and `number`. Add a field to
`SignUp` and every `Validators<SignUp>` object that lacks a rule for it stops compiling.
`Object.keys` returns `string[]`, which is why the loop asserts `(keyof T)[]`.

## Modifiers: `readonly` and `?`, added and removed

A mapped type copies the `readonly` and `?` of each property it maps over `keyof T`. Writing
`readonly` or `?` in the mapping adds the modifier; a `-` in front removes it (`+` is the
default). Above, `-?` makes every rule required, even for the optional `newsletter`, and
`-readonly` lets the form be edited. The misuses, appended to the program:

```ts
const incomplete: Validators<SignUp> = { email: () => null, age: () => null };
const wrongType: Validators<SignUp> = { email: () => null, age: (value: string) => null, newsletter: () => null };
const sent: SignUp = form;
sent.email = "eve@example.com";
```

```text
main.ts(30,7): error TS2741: Property 'newsletter' is missing in type '{ email: () => null; age: () => null; }' but required in type 'Validators<SignUp>'.
main.ts(31,60): error TS2322: Type '(value: string) => null' is not assignable to type '(value: number) => string | null'.
  Types of parameters 'value' and 'value' are incompatible.
    Type 'number' is not assignable to type 'string'.
main.ts(33,6): error TS2540: Cannot assign to 'email' because it is a read-only property.
```

`Partial<T>` is `{ [K in keyof T]?: T[K] }`, `Required<T>` is the same with `-?`, and
`Readonly<T>` adds `readonly`. `Record<K, V>` maps over any union of keys: `{ [P in K]: V }`.

## Renaming and filtering keys with `as`

After the key, `as` gives the property a new name, computed from `K`. If the new name is `never`,
the property is dropped:

```ts
interface Product {
  name: string;
  priceCents: number;
  stock: number;
  discontinued: boolean;
}

type Getters<T> = { [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K] };
type KeysOfType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };

const lamp: Product = { name: "Desk lamp", priceCents: 3499, stock: 12, discontinued: false };

const getters: Getters<Product> = {
  getName: () => lamp.name,
  getPriceCents: () => lamp.priceCents,
  getStock: () => lamp.stock,
  getDiscontinued: () => lamp.discontinued,
};
const counts: KeysOfType<Product, number> = { priceCents: 3499, stock: 12 };
console.log(getters.getName(), counts);
```

```text
Desk lamp { priceCents: 3499, stock: 12 }
```

`keyof T & string` keeps only string keys, because `Capitalize` needs a string and keys may also
be numbers or symbols. `KeysOfType` uses a conditional type as the new name: properties whose
type is not a `number` become `never` and vanish. The misuses:

```ts
getters.getname();
const withName: KeysOfType<Product, number> = { priceCents: 1, stock: 2, name: "x" };
```

```text
main.ts(21,9): error TS2551: Property 'getname' does not exist on type 'Getters<Product>'. Did you mean 'getName'?
main.ts(22,74): error TS2353: Object literal may only specify known properties, and 'name' does not exist in type 'KeysOfType<Product, number>'.
```

## Template literal types

A **template literal type** uses the backtick syntax of template strings in a type position.
With a union in a placeholder, it produces every combination. `${number}` matches any string
that reads as a number. `Uppercase`, `Lowercase`, `Capitalize` and `Uncapitalize` are
**intrinsic** types, built into the compiler:

```ts
type Size = "sm" | "lg";
type Tone = "primary" | "danger";
type ButtonClass = `btn-${Size}-${Tone}`;
type Pixels = `${number}px`;
type HandlerName<E extends string> = `on${Capitalize<E>}`;

const save: ButtonClass = "btn-lg-primary";
const gap: Pixels = "12.5px";
const onClick: HandlerName<"click"> = "onClick";
const level: Uppercase<"warn"> = "WARN";
console.log(save, gap, onClick, level);
```

```text
btn-lg-primary 12.5px onClick WARN
```

The misuses:

```ts
const medium: ButtonClass = "btn-md-primary";
const em: Pixels = "2em";
const lower: HandlerName<"click"> = "onclick";
```

```text
main.ts(12,7): error TS2820: Type '"btn-md-primary"' is not assignable to type '"btn-lg-danger" | "btn-lg-primary" | "btn-sm-danger" | "btn-sm-primary"'. Did you mean '"btn-sm-primary"'?
main.ts(13,7): error TS2322: Type '"2em"' is not assignable to type '`${number}px`'.
main.ts(14,7): error TS2322: Type '"onclick"' is not assignable to type '"onClick"'.
```

The two sizes times two tones make four members. TypeScript 7 lists them in its own stable order,
not the order you would expand them by hand. Large cross products slow the compiler down, so
keep the unions small.

## Parsing strings with `infer`

In a conditional type, a template literal can be a pattern, and `infer` captures the pieces. This
type finds the `:name` parameters of a route, calling itself on the rest of the path:

```ts
type ParamsOf<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ParamsOf<Rest>
  : Path extends `${string}:${infer Param}`
    ? Param
    : never;

function buildPath<P extends string>(path: P, params: Record<ParamsOf<P>, string>): string {
  const values: Record<string, string> = params;
  return path.replace(/:(\w+)/g, (_match, name: string) => encodeURIComponent(values[name]));
}

console.log(buildPath("/teams/:teamId/members/:memberId", { teamId: "t7", memberId: "m 42" }));
console.log(buildPath("/health", {}));
```

```text
/teams/t7/members/m%2042
/health
```

For `"/teams/:teamId/members/:memberId"`, the first pattern captures `teamId` and the rest
`members/:memberId`, which the second pattern turns into `memberId`. A path without parameters
gives `never`, and `Record<never, string>` is `{}`. The misuses:

```ts
buildPath("/teams/:teamId/members/:memberId", { teamId: "t7" });
buildPath("/teams/:teamId", { teamId: "t7", userId: "u1" });
```

```text
main.ts(14,47): error TS2741: Property 'memberId' is missing in type '{ teamId: string; }' but required in type 'Record<"memberId" | "teamId", string>'.
main.ts(15,45): error TS2353: Object literal may only specify known properties, and 'userId' does not exist in type 'Record<"teamId", string>'.
```

TypeScript 7 changed one detail: inference from template literals now works on Unicode code
points, so `${infer First}${infer Rest}` on `"😀abc"` captures `"😀"` whole, where TypeScript 6
split it into two UTF-16 halves.

## Common mistakes

- **`Capitalize<K>` on `keyof T`.** Keys may be numbers or symbols: error TS2344, "Type 'K' does
  not satisfy the constraint 'string'." Map over `keyof T & string`.
- **Expecting a mapped type to check values at run time.** `Validators<SignUp>` checks the code
  you write; the form data still arrives unchecked.
- **`Object.keys` returning `string[]`.** Objects may have extra keys at run time, so it is not
  `(keyof T)[]`; assert only where you know the keys.

## Practice

1. Write `Nullable<T>`, which allows `null` in every property.
2. Write `Setters<T>`, so that `Setters<Seat>` has `setRow(value: string)` and
   `setNumber(value: number)`.
3. Write `Split<S, D>`, so that `Split<"red,green,blue", ",">` is `["red", "green", "blue"]`.

### Answers

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };
type Setters<T> = { [K in keyof T & string as `set${Capitalize<K>}`]: (value: T[K]) => void };
type Split<S extends string, D extends string> = S extends `${infer Head}${D}${infer Tail}`
  ? [Head, ...Split<Tail, D>]
  : [S];

interface Seat {
  row: string;
  number: number;
}

const unknownSeat: Nullable<Seat> = { row: "F", number: null };
const setters: Setters<Seat> = {
  setRow: (value) => console.log(`row ${value}`),
  setNumber: (value) => console.log(`seat ${value.toFixed(0)}`),
};
const parts: Split<"red,green,blue", ","> = ["red", "green", "blue"];
setters.setNumber(12);
console.log(unknownSeat, parts);
```

```text
seat 12
{ row: 'F', number: null } [ 'red', 'green', 'blue' ]
```

`setters.setRow(5)` would be rejected: "Argument of type 'number' is not assignable to parameter
of type 'string'."

## Key takeaways

- `{ [K in keyof T]: ... }` builds one property per key; `T[K]` is that key's type.
- `readonly` and `?` are added in a mapping and removed with `-`.
- `as` renames keys; mapping a key to `never` drops it.
- Template literal types combine unions; `infer` inside one parses a string type.

## Further reading

- [TypeScript Handbook: Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript Handbook: Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
