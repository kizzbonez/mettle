---
title: Branded Types, satisfies and const
summary: Stop mixing up values that share a primitive type with brands, check a value against a type without losing its precise type using satisfies and as const, make objects readonly all the way down, and design types in which illegal states cannot be written.
minutes: 35
objectives:
  - Define a brand with a `unique symbol` and create branded values only through validating functions
  - Use `satisfies` together with `as const` to check a value and keep its literal type
  - Write a recursive `DeepReadonly<T>` and explain why `Readonly<T>` is shallow
  - Replace a bag of optional fields with a discriminated union that rules out impossible states
---

## Outline

1. Structural typing lets look-alikes through
2. Brands
3. `satisfies` and `as const`
4. Readonly all the way down
5. Making illegal states unrepresentable

## Structural typing lets look-alikes through

TypeScript compares types by **structure**: two types with the same shape are interchangeable.
That is usually what you want, but a user id and an order id are both `string`, and a price in
cents and a quantity are both `number`. A function `refund(user: string, order: string)` accepts
its arguments swapped, and the compiler cannot help. Other languages are **nominal**: types are
the same only if they have the same name. TypeScript can imitate that.

## Brands

A **brand** is an extra property that exists only in the type. Values of a branded type can only
be made through a function that checks them, which is the one place an `as` cast is allowed:

```ts
declare const brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [brand]: Name };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;
type Cents = Brand<number, "Cents">;

function toUserId(raw: string): UserId {
  if (!/^u-\d+$/.test(raw)) throw new Error(`not a user id: ${raw}`);
  return raw as UserId;
}
function toOrderId(raw: string): OrderId {
  if (!/^o-\d+$/.test(raw)) throw new Error(`not an order id: ${raw}`);
  return raw as OrderId;
}
function toCents(amount: number): Cents {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError(`not whole cents: ${amount}`);
  return amount as Cents;
}

function refund(user: UserId, order: OrderId, amount: Cents): string {
  return `refund ${amount} cents on ${order} to ${user.toUpperCase()}`;
}

const user = toUserId("u-17");
const order = toOrderId("o-902");
console.log(refund(user, order, toCents(1250)));
try {
  toCents(12.5);
} catch (error) {
  console.log(String(error));
}
```

```text
refund 1250 cents on o-902 to U-17
RangeError: not whole cents: 12.5
```

`declare const brand: unique symbol` declares a symbol that exists only for the compiler: no code
is emitted for it, and no other symbol type equals it, so no ordinary object can have the
`[brand]` property by accident. `UserId` is a `string` with that property added by intersection
(`&`), so string methods such as `toUpperCase` still work, and a `UserId` can be passed wherever
a `string` is expected. At run time it is a plain string: brands cost nothing. The misuses,
appended to the program:

```ts
refund(order, user, toCents(1250));
refund(user, order, 1250);
```

```text
main.ts(33,8): error TS2345: Argument of type 'OrderId' is not assignable to parameter of type 'UserId'.
  Type 'OrderId' is not assignable to type '{ readonly [brand]: "UserId"; }'.
    Types of property '[brand]' are incompatible.
      Type '"OrderId"' is not assignable to type '"UserId"'.
main.ts(34,21): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Cents'.
  Type 'number' is not assignable to type '{ readonly [brand]: "Cents"; }'.
```

A branded type means "this value has been checked". Validate once, at the edge of the program,
and the rest of the code can rely on it.

## `satisfies` and `as const`

An annotation such as `const plans: Record<string, Plan>` checks the value but then forgets it:
the variable has exactly the annotated type, so its keys are just `string`. The **`satisfies`**
operator (TypeScript 4.9) checks that a value matches a type *without changing the value's
type*. Combined with `as const`, which keeps literal types and makes everything `readonly`, you get
both a check and the most precise type:

```ts
interface Plan {
  readonly priceCents: number;
  readonly seats: number;
  readonly features: readonly string[];
}

const plans = {
  starter: { priceCents: 900, seats: 1, features: ["export"] },
  team: { priceCents: 2900, seats: 10, features: ["export", "sso"] },
} as const satisfies Record<string, Plan>;

type PlanName = keyof typeof plans;

function monthlyCost(name: PlanName, extraSeats: number): number {
  return plans[name].priceCents + extraSeats * 500;
}

const annotated: Record<string, Plan> = plans;
console.log(monthlyCost("team", 2), plans.team.features);
console.log(annotated.enterprise);
```

```text
3900 [ 'export', 'sso' ]
undefined
```

`PlanName` is `"starter" | "team"`, derived from the value, and `plans.team.seats` is the literal
type `10`. Through `annotated`, a missing plan compiles and is `undefined` at run time. The
misuses:

```ts
monthlyCost("enterprise", 0);
const tenSeats: 10 = plans.starter.seats;
const typo = { solo: { priceCents: 500, seat: 1, features: [] } } satisfies Record<string, Plan>;
```

```text
main.ts(21,13): error TS2345: Argument of type '"enterprise"' is not assignable to parameter of type '"starter" | "team"'.
main.ts(22,7): error TS2322: Type '1' is not assignable to type '10'.
main.ts(23,41): error TS2561: Object literal may only specify known properties, but 'seat' does not exist in type 'Plan'. Did you mean to write 'seats'?
```

`Plan` uses `readonly string[]` because `as const` makes the arrays readonly tuples, which a
mutable `string[]` would refuse.

## Readonly all the way down

`Readonly<T>` is **shallow**: it marks the top-level properties only. A recursive mapped type
goes deeper. Mapping over an array type with a homomorphic mapped type (one over `keyof T`) gives
a readonly array:

```ts
type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

interface Settings {
  theme: { name: string; accents: string[] };
  retries: number;
}

const loaded: Settings = { theme: { name: "dusk", accents: ["teal"] }, retries: 3 };
const shallow: Readonly<Settings> = loaded;
shallow.theme.accents.push("amber");
const deep: DeepReadonly<Settings> = loaded;
console.log(deep.theme.accents, deep.retries);
```

```text
[ 'teal', 'amber' ] 3
```

The shallow view let `push` through. Functions are left as they are. The misuses:

```ts
deep.theme.accents.push("red");
deep.theme.name = "noon";
shallow.retries = 4;
```

```text
main.ts(17,20): error TS2339: Property 'push' does not exist on type 'readonly string[]'.
main.ts(18,12): error TS2540: Cannot assign to 'name' because it is a read-only property.
main.ts(19,9): error TS2540: Cannot assign to 'retries' because it is a read-only property.
```

`readonly` is a compile-time promise: `loaded` itself can still be changed. For a run-time
guarantee, `Object.freeze` it as well.

## Making illegal states unrepresentable

A type like `{ sending: boolean; percent?: number; url?: string; reason?: string }` allows
nonsense such as a finished upload with a failure reason. A discriminated union lists only the
states that can exist, each with exactly the data it needs:

```ts
type Upload =
  | { status: "queued" }
  | { status: "sending"; percent: number }
  | { status: "done"; url: string }
  | { status: "failed"; reason: string };

function link(upload: Upload): string | null {
  return upload.status === "done" ? upload.url : null;
}

console.log(link({ status: "done", url: "/files/7" }), link({ status: "queued" }));
```

```text
/files/7 null
```

Once `status` is `"done"`, `url` is certain to exist: no check for a missing field is needed.
The misuses are rejected where they are written:

```ts
const finished: Upload = { status: "done" };
const confused: Upload = { status: "failed", reason: "timeout", url: "/files/8" };
```

```text
main.ts(12,7): error TS2322: Type '{ status: "done"; }' is not assignable to type 'Upload'.
  Property 'url' is missing in type '{ status: "done"; }' but required in type '{ status: "done"; url: string; }'.
main.ts(13,65): error TS2353: Object literal may only specify known properties, and 'url' does not exist in type '{ status: "failed"; reason: string; }'.
```

## Common mistakes

- **Casting to a brand all over the code.** `raw as UserId` anywhere defeats the brand. Keep the
  cast inside one validating function.
- **Annotating instead of `satisfies`.** The annotation widens the type and loses the keys.
- **`satisfies` before `as const`.** `{ ... } satisfies Plans as const` is error TS1355, "A
  'const' assertion can only be applied to references to enum members, or string, number,
  boolean, array, or object literals." Write `as const satisfies`.
- **Trusting `readonly` at run time.** It is erased; other code holding the object can change it.

## Practice

1. Make a `Percent` brand and `toPercent(value)` that accepts 0 to 100. Is `setVolume(50)`
   accepted when `setVolume` takes a `Percent`?
2. Write a `routes` object whose values must start with `/`, keeping its literal types.
3. Replace `{ loggedIn: boolean; userName?: string }` with a type in which a logged-out session
   cannot have a user name.

### Answers

```ts
declare const brand: unique symbol;
type Percent = number & { readonly [brand]: "Percent" };

function toPercent(value: number): Percent {
  if (value < 0 || value > 100) throw new RangeError(`not a percentage: ${value}`);
  return value as Percent;
}
function setVolume(level: Percent): string {
  return `volume ${level}%`;
}

const routes = {
  home: "/",
  settings: "/settings",
} as const satisfies Record<string, `/${string}`>;

type Session = { loggedIn: false } | { loggedIn: true; userName: string };
const guest: Session = { loggedIn: false };
const member: Session = { loggedIn: true, userName: "ada" };

console.log(setVolume(toPercent(50)), routes.settings, guest, member);
```

```text
volume 50% /settings { loggedIn: false } { loggedIn: true, userName: 'ada' }
```

`setVolume(50)` is rejected: "Argument of type 'number' is not assignable to parameter of type
'Percent'." So is `{ loggedIn: false, userName: "eve" }`, with error TS2353.

## Key takeaways

- A brand adds a type-only property so look-alike values cannot be mixed; create them through
  one validating function.
- `satisfies` checks a value without widening it; `as const satisfies` keeps literals too.
- `Readonly<T>` is shallow; a recursive mapped type makes `DeepReadonly<T>`.
- A discriminated union with exactly the data of each state rules out impossible combinations.

## Further reading

- [TypeScript 4.9 release notes: the satisfies operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [TypeScript Handbook: Object Types, readonly properties](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript Handbook: Everyday Types, literal types and as const](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
