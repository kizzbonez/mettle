---
title: Objects, Interfaces and Type Aliases
summary: Group values into objects, describe their shapes with interfaces and type aliases, use optional and readonly properties, understand structural typing and excess property checks, use index signatures for dictionaries, and destructure and spread objects.
minutes: 35
objectives:
  - Create objects, read and change their properties, and describe their shape with `interface` or `type`
  - Use optional and `readonly` properties and read the errors for missing or read-only properties
  - Explain structural typing and excess property checks
  - Use index signatures, `Object.entries`, object destructuring and spread
---

## Outline

1. Objects and properties
2. Naming a shape with `interface`
3. Optional and `readonly` properties
4. `interface` versus `type`
5. Structural typing
6. Excess property checks
7. Index signatures for dictionaries
8. Destructuring and spread

## Objects and properties

An **object** groups related values under names. Each name and value pair is a **property**:

```ts
const fern = { name: "Boston fern", heightCm: 40, indoor: true };
console.log(fern.name, fern["heightCm"]);
fern.heightCm = 42;
console.log(fern);
```

```text
Boston fern 40
{ name: 'Boston fern', heightCm: 42, indoor: true }
```

You read a property with a dot, `fern.name`, or with brackets and a string, `fern["heightCm"]`,
and you can assign to it. The compiler infers the object's type,
`{ name: string; heightCm: number; indoor: boolean; }`, and holds every use to it. Reading
`fern.colour` is
`error TS2339: Property 'colour' does not exist on type '{ name: string; heightCm: number; indoor: boolean; }'.`

## Naming a shape with `interface`

When many objects share a shape, or a function takes one, give the shape a name. An `interface`
lists the properties and their types:

```ts
interface Plant {
  readonly id: string;
  name: string;
  heightCm: number;
  potCm?: number;
}

function describe(plant: Plant): string {
  const pot = plant.potCm === undefined ? "no pot" : `${plant.potCm} cm pot`;
  return `${plant.name}, ${plant.heightCm} cm, ${pot}`;
}

const basil: Plant = { id: "P-07", name: "Basil", heightCm: 25 };
basil.heightCm = 30;
console.log(describe(basil));
console.log(describe({ id: "P-08", name: "Lemon tree", heightCm: 120, potCm: 40 }));
```

```text
Basil, 30 cm, no pot
Lemon tree, 120 cm, 40 cm pot
```

Type names are written in PascalCase. An interface produces no JavaScript at all: like every
type, it is erased.

## Optional and `readonly` properties

- `potCm?: number` is **optional**: an object may leave it out. Reading it gives
  `number | undefined`, so `describe` checks for `undefined` before using it.
- `readonly id: string` may be set when the object is created, never afterwards.

Both rules are enforced, and so is every required property. Added to the end of the program
above, these two lines fail:

```ts
basil.id = "P-99";
const mint: Plant = { id: "P-09", name: "Mint" };
```

```text
main.ts(9,7): error TS2540: Cannot assign to 'id' because it is a read-only property.
main.ts(10,7): error TS2741: Property 'heightCm' is missing in type '{ id: string; name: string; }' but required in type 'Plant'.
```

`readonly` is shallow: if a read-only property holds another object, that object's own properties
can still change.

## `interface` versus `type`

A **type alias** gives a name to any type with `type Name = ...;`. For an object shape, the two
are nearly interchangeable:

```ts
interface Plant {
  name: string;
  heightCm: number;
}

interface FruitTree extends Plant {
  fruit: string;
}

type Shrub = Plant & { evergreen: boolean };
type Centimetres = number;

const apple: FruitTree = { name: "Apple", heightCm: 300, fruit: "Bramley" };
const box: Shrub = { name: "Box", heightCm: 60, evergreen: true };
const gap: Centimetres = 45;
console.log(apple.fruit, box.evergreen, gap);
```

```text
Bramley true 45
```

- An interface grows with `extends`; a type alias combines shapes with `&`, an **intersection**,
  which means "has everything from both".
- A type alias can name any type, such as `number` or the unions of lesson 11; an interface can
  only describe objects.
- Two interfaces with the same name in one scope merge into one; a type alias cannot be declared
  twice.

The handbook's advice is to use `interface` until you need a feature of `type`. Many teams simply
use `type` everywhere; either way, be consistent.

## Structural typing

TypeScript compares types by their **structure**, not by their names. Any object that has the
properties a type requires fits that type, extra properties included:

```ts
interface Named {
  name: string;
}

function greet(thing: Named): string {
  return `Hello, ${thing.name}`;
}

const cat = { name: "Tom", lives: 9 };
console.log(greet(cat));
```

```text
Hello, Tom
```

`cat` was never declared as `Named`, but it has a `name` of type `string`, so it fits. This is
called **structural typing**, and it matches how JavaScript code is written: a function cares
about what an object has, not where it came from.

## Excess property checks

There is one exception. An object **literal** written directly where a type is expected may not
have properties the type does not know. Add this line to the program above:

```ts
console.log(greet({ name: "Tom", lives: 9 }));
```

```text
main.ts(11,34): error TS2353: Object literal may only specify known properties, and 'lives' does not exist in type 'Named'.
```

Nothing else could ever read `lives` from that literal, so it is almost certainly a mistake,
usually a misspelling. For a near miss the compiler even suggests the fix:
`error TS2561: Object literal may only specify known properties, but 'hieghtCm' does not exist in type 'Plant'. Did you mean to write 'heightCm'?`

## Index signatures for dictionaries

Sometimes the property names are data, not known in advance: stock counts by plant name, for
example. An **index signature** says "any string key, with values of this type":

```ts
const stock: { [plantName: string]: number } = { basil: 12, mint: 4 };
stock.thyme = 7;
stock["mint"] += 1;
console.log(stock, stock.rosemary);
for (const [plantName, count] of Object.entries(stock)) {
  console.log(`${plantName}: ${count}`);
}
console.log(Object.keys(stock));
```

```text
{ basil: 12, mint: 5, thyme: 7 } undefined
basil: 12
mint: 5
thyme: 7
[ 'basil', 'mint', 'thyme' ]
```

`Object.entries` gives an array of `[key, value]` tuples, ready to destructure in a `for...of`;
`Object.keys` gives the keys and `Object.values` the values. A missing key reads as `undefined`, although its type says `number`:
check before you trust it. (The medium level shows `Map`, often a better tool for this.)

## Destructuring and spread

Object **destructuring** unpacks properties by name. `heightCm: height` renames, and `= 10` gives a
default for a missing value. Destructuring also works on a parameter. **Spread** copies all
properties into a new object, and later properties win:

```ts
const basil: Plant = { name: "Basil", heightCm: 25 };
const { name, heightCm: height, potCm = 10 } = basil;
console.log(name, height, potCm);
const taller = { ...basil, heightCm: 35 };
console.log(taller, basil.heightCm);

function label({ name, heightCm }: Plant): string {
  return `${name} (${heightCm} cm)`;
}
console.log(label(taller));
```

```text
Basil 25 10
{ name: 'Basil', heightCm: 35 } 25
Basil (35 cm)
```

`{ ...basil, heightCm: 35 }` is the usual way to make a changed copy while leaving the original
alone.

## Common mistakes

- **Annotating inside a destructuring.** `const { name: string } = basil;` renames `name` to a
  variable called `string`, so `console.log(name)` is `error TS2304: Cannot find name 'name'.`
  Annotate the whole pattern: `const { name }: Plant = basil;`.
- **Forgetting the optional check.** `plant.potCm.toFixed()` is
  `error TS18048: 'plant.potCm' is possibly 'undefined'.` Check for `undefined` first.
- **Expecting spread to copy deeply.** Spread copies one level. Nested objects are shared:

  ```ts
  const original = { name: "Fig", care: { water: "weekly" } };
  const copy = { ...original };
  copy.name = "Olive";
  copy.care.water = "daily";
  console.log(original);
  ```

  ```text
  { name: 'Fig', care: { water: 'daily' } }
  ```

  Spread the inner object too: `{ ...original, care: { ...original.care } }`.

## Practice

1. Write an interface `Book` with `title`, `author`, `year` and an optional `subtitle`, and a
   function `citation(book: Book): string` that returns `Author (Year). Title.` or
   `Author (Year). Title: Subtitle.`
2. Count the words of `"the cat saw the other cat"` in an object with an index signature.
3. What is `{ ...{ a: 1, b: 2 }, ...{ b: 3 } }`?

### Answers

1. ```ts
   interface Book {
     title: string;
     author: string;
     year: number;
     subtitle?: string;
   }

   function citation(book: Book): string {
     const fullTitle = book.subtitle === undefined ? book.title : `${book.title}: ${book.subtitle}`;
     return `${book.author} (${book.year}). ${fullTitle}.`;
   }
   ```

   `citation({ title: "Silent Spring", author: "Rachel Carson", year: 1962 })` returns
   `Rachel Carson (1962). Silent Spring.`
2. ```ts
   const counts: { [word: string]: number } = {};
   for (const word of "the cat saw the other cat".split(" ")) {
     counts[word] = (counts[word] === undefined ? 0 : counts[word]) + 1;
   }
   console.log(counts);
   ```

   ```text
   { the: 2, cat: 2, saw: 1, other: 1 }
   ```
3. `{ a: 1, b: 3 }`: the later `b` wins.

## Key takeaways

- Objects group named properties; the compiler infers and enforces their shape.
- `interface` and `type` name shapes; `?` makes a property optional, `readonly` forbids
  reassignment.
- Types are compared by structure: extra properties are fine, except in an object literal written
  directly where the type is expected.
- `{ [key: string]: T }` describes a dictionary; `Object.entries` and `Object.keys` walk it.
- Destructuring unpacks by name with renames and defaults; spread makes shallow copies.

## Further reading

- [TypeScript handbook: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript handbook: Everyday Types, interfaces and type aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
- [MDN: Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)
- [MDN: Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring)
