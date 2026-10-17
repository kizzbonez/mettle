---
title: Maps, Sets and Iteration
summary: Store key-value pairs in a typed `Map` and unique values in a `Set`, combine sets with the ES2025 set methods, attach data to objects with `WeakMap`, and understand the iteration protocol behind `for...of`, generator functions and the lazy ES2025 iterator helpers.
minutes: 35
objectives:
  - Use `Map<K, V>` and `Set<T>`, and explain why `get` returns `V | undefined`
  - Combine sets with `union`, `intersection`, `difference` and the subset checks
  - Explain when a `WeakMap` is the right store
  - Make a class iterable, write generator functions, and chain lazy iterator helpers
---

## Outline

1. Why not just objects?
2. `Map`
3. `Set` and the ES2025 set methods
4. `WeakMap`
5. The iteration protocol
6. Generator functions
7. Iterator helpers

## Why not just objects?

Lesson 7 ended with a plain object used as a lookup table and the care it needs: keys must be
strings, inherited names such as `toString` lurk, and there is no `size`. JavaScript has two
collections made for the job. A **`Map`** holds key-value pairs with keys of any type, and a
**`Set`** holds unique values. Both remember insertion order, and both are generic types in
TypeScript: `Map<K, V>` and `Set<T>`.

## `Map`

```ts
const checkpointLog = ["CP1:R12", "CP1:R7", "CP2:R12", "CP1:R30", "CP2:R7", "CP3:R12"];

const passes = new Map<string, number>();
for (const entry of checkpointLog) {
  const runner = entry.split(":")[1];
  passes.set(runner, (passes.get(runner) ?? 0) + 1);
}

console.log(passes);
console.log(passes.size, passes.has("R30"), passes.get("R99"));
for (const [runner, count] of passes) {
  console.log(`${runner} at ${count} of 3 checkpoints`);
}
passes.delete("R30");
console.log([...passes.keys()]);
```

```text
Map(3) { 'R12' => 3, 'R7' => 2, 'R30' => 1 }
3 true undefined
R12 at 3 of 3 checkpoints
R7 at 2 of 3 checkpoints
R30 at 1 of 3 checkpoints
[ 'R12', 'R7' ]
```

`new Map<string, number>()` gives the type arguments, since an empty map has nothing to infer
from. `set` adds or replaces, `get` reads, `has` tests, `delete` removes and `size` counts.
Looping over a map gives `[key, value]` pairs, which destructure neatly. `keys()`, `values()` and
`entries()` give one part at a time.

`get` returns `V | undefined`, because the key may be missing, as `passes.get("R99")` shows. The
compiler holds you to it:

```text
main.ts(16,7): error TS2322: Type 'number | undefined' is not assignable to type 'number'.
  Type 'undefined' is not assignable to type 'number'.
```

That is the line `const leader: number = passes.get("R12");`. Handle the missing case with `??`,
as the counting loop does, or check with `has` first. Keys may be any value, including objects,
which are compared by identity: two separate objects with the same fields are two keys.
`Map.groupBy(items, keyFunction)` (ES2024) builds a `Map` of arrays in one call.

## `Set` and the ES2025 set methods

A `Set` keeps each value once. ES2025 added methods that combine sets, and TypeScript's `es2025`
library knows them:

```ts
const saturday = new Set(["Ana", "Ben", "Chen", "Dara"]);
const sunday = new Set(["Chen", "Dara", "Eli"]);

console.log(saturday.union(sunday));
console.log(saturday.intersection(sunday));
console.log(saturday.difference(sunday));
console.log(saturday.symmetricDifference(sunday));
console.log(new Set(["Chen"]).isSubsetOf(sunday), saturday.isDisjointFrom(sunday));

const bibs = new Set<number>();
bibs.add(12).add(7).add(12);
console.log(bibs.size, bibs.has(7), [...bibs]);
```

```text
Set(5) { 'Ana', 'Ben', 'Chen', 'Dara', 'Eli' }
Set(2) { 'Chen', 'Dara' }
Set(2) { 'Ana', 'Ben' }
Set(3) { 'Ana', 'Ben', 'Eli' }
true false
2 true [ 12, 7 ]
```

`union` is everyone who came on either day; `intersection` those who came both days;
`difference` those who came only on Saturday; `symmetricDifference` those who came on exactly one
day. Each returns a new set and leaves both originals alone. `isSubsetOf`, `isSupersetOf` and
`isDisjointFrom` answer yes or no. Adding `12` twice kept one, and `[...bibs]` turns a set back
into an array. `[...new Set(list)]` is the usual way to remove duplicates from an array.

## `WeakMap`

A `WeakMap` is a map whose keys must be objects and which holds them *weakly*: if nothing else
in the program refers to a key object, the garbage collector may delete it along with its entry.
That makes it the right place to attach extra data to objects you do not own, without keeping
them alive forever:

```ts
interface Runner {
  bib: number;
  name: string;
}

const lastSeen = new WeakMap<Runner, string>();

const ana: Runner = { bib: 12, name: "Ana" };
lastSeen.set(ana, "CP3");
console.log(lastSeen.get(ana), lastSeen.has({ bib: 12, name: "Ana" }));
```

```text
CP3 false
```

The second lookup uses a different object with equal fields, so it finds nothing. Primitive keys
are refused: `lastSeen.set("Ana", "CP1")` is error TS2345, "Argument of type 'string' is not
assignable to parameter of type 'Runner'." A `WeakMap` cannot be looped over or counted, because
its contents may vanish at any moment.

## The iteration protocol

`for...of` and spread `...` work on any **iterable**: an object with a method under the key
`Symbol.iterator` that returns an **iterator**. An iterator has a `next()` method returning
`{ value, done }` objects until `done` is `true`. TypeScript names these shapes `Iterable<T>` and
`Iterator<T>`. Arrays, strings, maps and sets are all iterable, and your own classes can be:

```ts
class Countdown implements Iterable<number> {
  readonly from: number;

  constructor(from: number) {
    this.from = from;
  }

  [Symbol.iterator](): Iterator<number> {
    let current = this.from;
    return {
      next: () => (current > 0 ? { value: current--, done: false } : { value: undefined, done: true }),
    };
  }
}

function* countdown(from: number): Generator<number> {
  for (let n = from; n > 0; n -= 1) {
    yield n;
  }
}

console.log([...new Countdown(3)]);
for (const n of countdown(3)) {
  console.log(`starting in ${n}`);
}
const steps = countdown(2);
console.log(steps.next(), steps.next(), steps.next());
```

```text
[ 3, 2, 1 ]
starting in 3
starting in 2
starting in 1
{ value: 2, done: false } { value: 1, done: false } { value: undefined, done: true }
```

## Generator functions

Writing `next` by hand is fiddly. A **generator function**, declared with `function*`, does it for
you. Calling it runs nothing yet; it returns a `Generator` object, which is both an iterator and
iterable. Each `next()` runs the body until the next `yield`, which hands out one value and pauses
there. When the body ends, `done` becomes `true`, as the last line of output shows. Type a
generator's return as `Generator<T>`, where `T` is what it yields.

Because a generator only runs on demand, it can describe an endless sequence, as long as the
consumer stops asking.

## Iterator helpers

Arrays have `map` and `filter`, but those build a whole new array at each step. ES2025 added
**iterator helpers** to built-in iterators: `map`, `filter`, `take`, `drop`, `flatMap`, `reduce`,
`some`, `every`, `find`, `forEach` and `toArray`, plus `Iterator.from` to wrap any iterable. They
are **lazy**: nothing runs until something consumes the result.

```ts
function* lapNumbers(): Generator<number> {
  let lap = 1;
  while (true) {
    yield lap;
    lap += 1;
  }
}

const evenLaps = lapNumbers()
  .filter((lap) => lap % 2 === 0)
  .map((lap) => {
    console.log(`computing lap ${lap}`);
    return `lap ${lap}`;
  })
  .take(3);
console.log("nothing computed yet");
console.log(evenLaps.toArray());

const splits = new Map([
  ["CP1", 31],
  ["CP2", 44],
  ["CP3", 28],
]);
const total = splits.values().reduce((sum, minutes) => sum + minutes, 0);
const slow = splits.entries().filter(([, minutes]) => minutes > 30).map(([checkpoint]) => checkpoint);
console.log(total, [...slow]);
```

```text
nothing computed yet
computing lap 2
computing lap 4
computing lap 6
[ 'lap 2', 'lap 4', 'lap 6' ]
103 [ 'CP1', 'CP2' ]
```

`lapNumbers()` never ends, yet the chain finishes, because `take(3)` stops asking after three
values and each value flows through the whole chain one at a time. On a map, `values()` and
`entries()` return iterators, so the helpers work there without first copying into an array.
Helpers live on iterators, not arrays: `laps.take(2)` on an array is error TS2339, "Property
'take' does not exist on type 'number[]'". Write `laps.values().take(2)`.

## Common mistakes

- **Using brackets on a `Map`**: `passes["R12"] = 3` is error TS7052, "...Did you mean to call
  'passes.set'?" In JavaScript it would set a plain property beside the map's entries.
- **Ignoring `undefined` from `get`.** Use `??`, or check `has` first.
- **Expecting objects with equal fields to be one key.** Maps and sets compare objects by
  identity; use a string key such as an id.
- **Reusing a used-up iterator.** An iterator runs once: a second `[...slow]` gives `[]`.
- **Turning an endless generator into an array** with `[...lapNumbers()]` or `toArray()` before
  a `take`. It never finishes.

## Practice

1. With sets, find the stations in both `["S1", "S4", "S7", "S9"]` and `["S4", "S9", "S12"]`, and
   those only in the first.
2. Write a generator `range(start, end, step = 1)` that yields numbers from `start` up to, but not
   including, `end`.
3. Using `range` and iterator helpers, list the squares of the first five odd numbers.
4. Group `[{ name: "Ana", category: "U20" }, { name: "Ben", category: "Open" }, { name: "Chen",
   category: "U20" }]` by category with `Map.groupBy` and print the U20 names.

### Answers

```ts
function* range(start: number, end: number, step = 1): Generator<number> {
  for (let n = start; n < end; n += step) {
    yield n;
  }
}

const morning = new Set(["S1", "S4", "S7", "S9"]);
const evening = new Set(["S4", "S9", "S12"]);
console.log(morning.intersection(evening), morning.difference(evening));

console.log([...range(0, 10, 3)]);
const oddSquares = range(1, Infinity, 2)
  .map((n) => n * n)
  .take(5)
  .toArray();
console.log(oddSquares);

const runners = [
  { name: "Ana", category: "U20" },
  { name: "Ben", category: "Open" },
  { name: "Chen", category: "U20" },
];
const byCategory = Map.groupBy(runners, (runner) => runner.category);
console.log(byCategory.get("U20")?.map((runner) => runner.name));
```

```text
Set(2) { 'S4', 'S9' } Set(2) { 'S1', 'S7' }
[ 0, 3, 6, 9 ]
[ 1, 9, 25, 49, 81 ]
[ 'Ana', 'Chen' ]
```

## Key takeaways

- `Map<K, V>` takes keys of any type and has `size`; `get` returns `V | undefined`.
- `Set<T>` keeps unique values; ES2025 adds `union`, `intersection`, `difference` and friends.
- `WeakMap` attaches data to objects without keeping them alive, and cannot be iterated.
- An iterable has `[Symbol.iterator]()`; `function*` and `yield` write iterators for you, and
  the lazy iterator helpers chain over them, even endless ones.

## Further reading

- [MDN: Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [MDN: Set, including set composition](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [MDN: Iterator and its helper methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator)
- [MDN: Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
