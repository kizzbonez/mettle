---
title: Utility Types
summary: Derive new types from the ones you have with TypeScript's built-in utility types, from `Partial`, `Required`, `Readonly`, `Pick`, `Omit` and `Record` for object types to `Exclude`, `Extract` and `NonNullable` for unions and `ReturnType`, `Parameters` and `Awaited` for functions.
minutes: 30
objectives:
  - Transform object types with `Partial`, `Required`, `Readonly`, `Pick`, `Omit` and `Record`
  - Filter union types with `Exclude`, `Extract` and `NonNullable`
  - Read a function's types with `ReturnType`, `Parameters` and `Awaited`
  - Avoid the traps of shallow `Readonly` and unchecked `Omit` keys
---

## Outline

1. One source of truth
2. `Partial`, `Required` and `Readonly`
3. `Pick`, `Omit` and `Record`
4. `Exclude`, `Extract` and `NonNullable`
5. `ReturnType`, `Parameters` and `Awaited`
6. Combining utility types

## One source of truth

Real programs need several versions of one shape. A booking has an `id`, but a booking being
created does not have one yet. An update changes some fields, not all. A summary card shows two
fields of the ten. Writing a separate interface for each version means that adding a field later
needs edits in five places, and one will be missed.

**Utility types** are generic types built into TypeScript that compute a new type from an existing
one. You write the main interface once, and derive the variations from it, so they can never
drift apart. All of them are written with the generic syntax from lesson 3:
`Partial<Booking>` is the type `Partial` applied to the type argument `Booking`. The examples in
this lesson share this interface:

```ts
interface Booking {
  id: string;
  room: string;
  guest: string;
  nights: number;
  notes?: string;
}
```

## `Partial`, `Required` and `Readonly`

- `Partial<T>` makes every property optional.
- `Required<T>` makes every property required, removing the `?`.
- `Readonly<T>` makes every property `readonly`.

A typical use is an update function that receives only the fields that change:

```ts
type BookingChanges = Partial<Omit<Booking, "id">>;

function applyChanges(booking: Readonly<Booking>, changes: BookingChanges): Booking {
  return { ...booking, ...changes };
}

const original: Readonly<Booking> = { id: "B-301", room: "Fern", guest: "Okafor", nights: 2 };
const longer = applyChanges(original, { nights: 4, notes: "late arrival" });
console.log(longer);
console.log(original.nights);
```

```text
{
  id: 'B-301',
  room: 'Fern',
  guest: 'Okafor',
  nights: 4,
  notes: 'late arrival'
}
2
```

`BookingChanges` is "any subset of the fields except `id`". The spread copies the booking and then
the changes over it, so the original stays untouched, and `Readonly` in the parameter promises the
caller that it will. Add these three lines and the compiler enforces each type:

```ts
applyChanges(original, { id: "B-999" });
original.nights = 3;
const complete: Required<Booking> = { id: "B-302", room: "Moss", guest: "Lund", nights: 1 };
```

```text
main.ts(19,26): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type 'Partial<Omit<Booking, "id">>'.
main.ts(20,10): error TS2540: Cannot assign to 'nights' because it is a read-only property.
main.ts(21,7): error TS2741: Property 'notes' is missing in type '{ id: string; room: string; guest: string; nights: number; }' but required in type 'Required<Booking>'.
```

`Readonly` is **shallow**: it covers the object's own properties, not the objects inside them. A
`Readonly<{ name: string; amenities: string[] }>` still lets you call `amenities.push("desk")`.
The advanced level builds a deep version.

## `Pick`, `Omit` and `Record`

- `Pick<T, Keys>` keeps only the listed properties.
- `Omit<T, Keys>` keeps all properties except the listed ones.
- `Record<Keys, Value>` builds an object type with the given keys, all with the same value type.

```ts
type RoomType = "single" | "double" | "suite";
type BookingCard = Pick<Booking, "room" | "nights">;
type NewBooking = Omit<Booking, "id">;

const nightlyRate: Record<RoomType, number> = { single: 60, double: 85, suite: 140 };
const card: BookingCard = { room: "Fern", nights: 2 };
const draft: NewBooking = { room: "Moss", guest: "Lund", nights: 1 };
const nightsByGuest: Record<string, number> = {};
nightsByGuest[draft.guest] = draft.nights;

console.log(nightlyRate.suite * card.nights, nightsByGuest);
```

```text
280 { Lund: 1 }
```

Keys are given as a union of string literals. `Record` with a union of keys is a checklist: the
object must have every key, so forgetting a room type is an error. `Record<string, number>` is a
dictionary with any string keys, the same as the index signature `{ [key: string]: number }`.
Here are a missing key and a key that does not exist:

```ts
const partialRates: Record<RoomType, number> = { single: 60, double: 85 };
type Wrong = Pick<Booking, "price">;
type Silent = Omit<Booking, "price">;
```

```text
main.ts(20,7): error TS2741: Property 'suite' is missing in type '{ single: number; double: number; }' but required in type 'Record<RoomType, number>'.
main.ts(21,28): error TS2344: Type '"price"' does not satisfy the constraint 'keyof Booking'.
```

Notice what is *not* reported. `Pick` requires its keys to exist, but `Omit` accepts any string,
so a typo in `Omit` silently removes nothing.

## `Exclude`, `Extract` and `NonNullable`

These three work on unions:

- `Exclude<U, X>` removes the members of `U` that are assignable to `X`.
- `Extract<U, X>` keeps only those members.
- `NonNullable<T>` removes `null` and `undefined`.

`Extract` is especially handy with discriminated unions from lesson 4: it picks one member by its
tag.

## `ReturnType`, `Parameters` and `Awaited`

These read the types of a function. They take a *type*, so pass `typeof myFunction`, which
turns the function value into its type. `Awaited` unwraps a `Promise`, the type an `async`
function returns; lesson 9 covers promises properly. This program stands alone:

```ts
type Status = "pending" | "confirmed" | "cancelled";
type ActiveStatus = Exclude<Status, "cancelled">;

type RoomEvent =
  | { kind: "booked"; guest: string }
  | { kind: "cleaned"; by: string }
  | { kind: "blocked"; reason: string };
type BookedEvent = Extract<RoomEvent, { kind: "booked" }>;

function quote(room: string, nights: number, discount?: number): { room: string; total: number } {
  return { room, total: nights * 85 * (1 - (discount ?? 0)) };
}

type Quote = ReturnType<typeof quote>;
type QuoteArgs = Parameters<typeof quote>;

async function loadGuest(id: string): Promise<string | null> {
  return id === "G1" ? "Okafor" : null;
}

type Guest = Awaited<ReturnType<typeof loadGuest>>;
type KnownGuest = NonNullable<Guest>;

const active: ActiveStatus = "pending";
const event: BookedEvent = { kind: "booked", guest: "Lund" };
const args: QuoteArgs = ["Fern", 3];
const result: Quote = quote(...args);
const guest: KnownGuest = "Okafor";
console.log(active, event.guest, result, guest);
```

```text
pending Lund { room: 'Fern', total: 255 } Okafor
```

`Parameters` gives a tuple of the parameter types, so `quote(...args)` spreads it back into a call.
`Guest` is `string | null`, and `KnownGuest` is `string`. The errors on wrong values show the
computed types:

```text
main.ts(30,7): error TS2322: Type '"cancelled"' is not assignable to type 'ActiveStatus'.
main.ts(31,32): error TS2322: Type '"cleaned"' is not assignable to type '"booked"'.
main.ts(32,7): error TS2322: Type '[string, number, number, string]' is not assignable to type '[room: string, nights: number, discount?: number | undefined]'.
  Source has 4 element(s) but target allows only 3.
main.ts(33,7): error TS2322: Type 'null' is not assignable to type 'string'.
```

Those came from `"cancelled"` as an `ActiveStatus`, a `"cleaned"` event as a `BookedEvent`, four
arguments as `QuoteArgs`, and `null` as a `KnownGuest`.

`ReturnType` and `Parameters` are most useful for functions you do not own, such as a library
function whose result type was never exported.

## Combining utility types

Utility types nest, as `Partial<Omit<Booking, "id">>` showed. Read them from the inside out:
remove `id`, then make the rest optional. When a combination gets hard to read, give it a name
with `type`. The advanced level shows how these types are themselves written, with mapped and
conditional types.

## Common mistakes

- **Typos in `Omit`.** `Omit<Booking, "note">` removes nothing and reports nothing. Check the key,
  or use `Pick` for the fields you keep.
- **Trusting `Readonly` for nested data.** Arrays and objects inside are still mutable.
- **Forgetting `typeof`**: `ReturnType<quote>` is error TS2749, "'quote' refers to a value, but is
  being used as a type here. Did you mean 'typeof quote'?"
- **Using `Partial` for data that must be complete.** A `Partial<Booking>` passed where a booking
  is saved lets half-filled records through.

## Practice

1. Given `interface Product { sku: string; name: string; price: number; stock: number }`, write a
   type `PriceChange` with only `sku` and `price`, and a type `NewProduct` without `sku`.
2. With `type Weekday = "mon" | "tue" | "wed" | "thu" | "fri"`, declare `openingHours` so that
   every weekday must have a number.
3. Which type is `Exclude<"a" | "b" | "c", "a" | "z">`?

### Answers

```ts
interface Product {
  sku: string;
  name: string;
  price: number;
  stock: number;
}

type PriceChange = Pick<Product, "sku" | "price">;
type NewProduct = Omit<Product, "sku">;
type Weekday = "mon" | "tue" | "wed" | "thu" | "fri";

const change: PriceChange = { sku: "TEA-01", price: 4.5 };
const fresh: NewProduct = { name: "Green tea", price: 3.9, stock: 0 };
const openingHours: Record<Weekday, number> = { mon: 8, tue: 8, wed: 6, thu: 8, fri: 10 };
type Letters = Exclude<"a" | "b" | "c", "a" | "z">;
const letter: Letters = "b";
console.log(change, fresh.name, openingHours.fri, letter);
```

```text
{ sku: 'TEA-01', price: 4.5 } Green tea 10 b
```

3. `"b" | "c"`. `"a"` is removed; `"z"` was never a member, so excluding it changes nothing.
   Assigning `"a"` to `Letters` is error TS2322.

## Key takeaways

- Write the main type once and derive variations with utility types, so they cannot drift apart.
- `Partial`, `Required` and `Readonly` change modifiers; `Readonly` is shallow.
- `Pick` keeps keys (and checks them), `Omit` removes keys (and does not), `Record` builds an
  object type from keys.
- `Exclude`, `Extract` and `NonNullable` filter unions; `ReturnType`, `Parameters` and `Awaited`
  read function types through `typeof`.

## Further reading

- [TypeScript Handbook: Utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook: Typeof type operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
