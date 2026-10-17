---
title: Arrays and Tuples
summary: Store lists of values in typed arrays, add and remove items, transform them with map, filter and reduce, search them with find, some and every, sort them safely, protect them with readonly, and use tuples, destructuring and spread.
minutes: 35
objectives:
  - Declare arrays as `T[]` or `Array<T>`, read and change items, and add and remove them
  - Use `map`, `filter`, `reduce`, `find`, `some` and `every` with typed callbacks
  - Sort numbers and strings correctly, and choose between `sort` and `toSorted`
  - Use `readonly` arrays, tuples, destructuring and spread
---

## Outline

1. Arrays and their types
2. Adding and removing items
3. `map`, `filter` and `reduce`
4. `find`, `some` and `every`
5. Sorting: `sort` versus `toSorted`
6. `readonly` arrays
7. Tuples
8. Destructuring and spread

## Arrays and their types

An **array** is an ordered list of values, written in square brackets. Each value is an
**element**, and its position, counted from 0, is its **index**:

```ts
const crops: string[] = ["kale", "beans", "squash"];
const weights: Array<number> = [1.2, 3.5, 0.8];
console.log(crops[0], crops.length, crops[crops.length - 1], crops.at(-1));
console.log(crops[5]);
crops[1] = "peas";
console.log(crops, weights);
console.log(crops.join(" + "));
```

```text
kale 3 squash squash
undefined
[ 'kale', 'peas', 'squash' ] [ 1.2, 3.5, 0.8 ]
kale + peas + squash
```

`string[]` and `Array<string>` are two spellings of the same type, "array of strings"; this course
uses `string[]`. Without the annotations the compiler infers the same types. Every element must fit:
`const tally: number[] = [1, "two", 3];` is
`error TS2322: Type 'string' is not assignable to type 'number'.`

Reading past the end gives `undefined`, even though the type of `crops[5]` is `string`: with
these settings the compiler trusts that indexes are in range. `const` stops `crops` from being
assigned a different array, but the array itself can still change, as `crops[1] = "peas"` shows.
`join` is the opposite of `split`: it glues the elements into one string. An empty array needs an
annotation, such as `const names: string[] = [];`, so the compiler knows what will go in it.

## Adding and removing items

```ts
const queue = ["kale", "beans"];
queue.push("squash");
queue.unshift("radish");
console.log(queue);
const last = queue.pop();
const first = queue.shift();
console.log(last, first, queue);
console.log(queue.includes("beans"), queue.indexOf("kale"), queue.indexOf("leek"));
```

```text
[ 'radish', 'kale', 'beans', 'squash' ]
squash radish [ 'kale', 'beans' ]
true 0 -1
```

`push` adds at the end and `unshift` at the start; `pop` and `shift` remove and return the last
and first element. Because an array may be empty, `pop` and `shift` return `string | undefined`.
`includes` and `indexOf` search as they do for strings. (`splice(start, count)` removes elements
from the middle.)

## `map`, `filter` and `reduce`

These methods take a function, called a **callback**, and run it on each element. None of them
changes the original array:

```ts
const harvest = [1.2, 3.5, 0.8, 2.4];
const grams = harvest.map((kg) => kg * 1000);
const heavy = harvest.filter((kg) => kg >= 2);
const total = harvest.reduce((sum, kg) => sum + kg, 0);
console.log(grams, heavy, total);
```

```text
[ 1200, 3500, 800, 2400 ] [ 3.5, 2.4 ] 7.9
```

- `map` builds a new array from what the callback returns for each element.
- `filter` keeps the elements for which the callback returns true.
- `reduce` combines all elements into one value. The callback receives the result so far (`sum`)
  and the next element; the second argument, `0`, is the starting value.

The callbacks need no annotations: `kg` is a `number` by contextual typing (lesson 7), and the
result types follow, so `grams` is `number[]`.

## `find`, `some` and `every`

Continuing with the same `harvest`:

```ts
const firstSmall = harvest.find((kg) => kg < 1);
const firstHuge = harvest.find((kg) => kg > 10);
console.log(firstSmall, firstHuge, harvest.some((kg) => kg > 3), harvest.every((kg) => kg > 1));
```

```text
0.8 undefined true false
```

`find` returns the first element that matches, or `undefined` when none does, so its type is
`number | undefined`. `some` asks "does any element match?" and `every` "do all match?". Use
`includes` for a plain value and `some` for a condition.

## Sorting: `sort` versus `toSorted`

```ts
const counts = [10, 9, 1, 100];
console.log(counts.toSorted());
console.log(counts.toSorted((a, b) => a - b));
console.log(counts);
counts.sort((a, b) => b - a);
console.log(counts);
const crops = ["kale", "Beans", "apple"];
console.log(crops.toSorted(), crops.toSorted((a, b) => a.localeCompare(b)));
```

```text
[ 1, 10, 100, 9 ]
[ 1, 9, 10, 100 ]
[ 10, 9, 1, 100 ]
[ 100, 10, 9, 1 ]
[ 'Beans', 'apple', 'kale' ] [ 'apple', 'Beans', 'kale' ]
```

Without a callback, sorting converts every element to a string and compares code units, so 100
comes before 9 and capitals before lower case. Always pass a **comparator** `(a, b) => ...` that
returns a negative number when `a` goes first, a positive one when `b` goes first, and 0 for a
tie: `a - b` sorts numbers upward, `b - a` downward, and `a.localeCompare(b)` sorts words.

`toSorted` (ES2023) returns a sorted **copy**. `sort` sorts the array **in place**, changing it for
every part of the program that uses it. Prefer `toSorted` unless you mean to change the original.

## `readonly` arrays

Writing `readonly` before an array type removes every method that changes the array:

```ts
const seasons: readonly string[] = ["spring", "summer"];
seasons.push("autumn");
```

```text
main.ts(2,9): error TS2339: Property 'push' does not exist on type 'readonly string[]'.
```

Use `readonly` for parameters of functions that only read an array: the type promises the caller
that the function will not change it.

## Tuples

A **tuple** is an array with a fixed length and a type for each position:

```ts
function range(values: readonly number[]): [number, number] {
  return [Math.min(...values), Math.max(...values)];
}

const plot: [string, number] = ["B4", 12.5];
const [plotName, area] = plot;
console.log(plotName, area);
const [low, high] = range([4, 9, 2]);
console.log(low, high);
```

```text
B4 12.5
2 9
```

`[string, number]` means "exactly two elements, a string then a number". Reading `plot[2]` is
`error TS2493: Tuple type '[string, number]' of length '2' has no element at index '2'.` Tuples
suit a function that returns two values; for more than two or three, an object with named
properties (lesson 9) is clearer.

## Destructuring and spread

**Destructuring** unpacks an array into variables by position, as `const [low, high] = ...` did
above. `...` in a destructuring collects the rest. `...` in an array literal or a call is
**spread**: it lays the elements out one by one, as in `Math.min(...values)`:

```ts
const [first, second, ...others] = ["kale", "beans", "squash", "peas"];
console.log(first, second, others);
const more = [...others, "leeks"];
const copy = [...more];
copy.push("chard");
console.log(more, copy);
```

```text
kale beans [ 'squash', 'peas' ]
[ 'squash', 'peas', 'leeks' ] [ 'squash', 'peas', 'leeks', 'chard' ]
```

`[...more]` makes a new array, so pushing to `copy` leaves `more` unchanged.

## Common mistakes

- **Sorting numbers without a comparator.** `[10, 9, 1, 100].toSorted()` gives
  `[ 1, 10, 100, 9 ]`. Pass `(a, b) => a - b`.
- **Using `find`'s result without a check.** `found.toFixed(1)` is
  `error TS18048: 'found' is possibly 'undefined'.` Test `if (found !== undefined)` first.
- **Braces without `return` in `map`.** The callback returns nothing:

  ```ts
  const grams: number[] = harvest.map((kg) => {
    kg * 1000;
  });
  ```

  ```text
  main.ts(2,7): error TS2322: Type 'void[]' is not assignable to type 'number[]'.
    Type 'void' is not assignable to type 'number'.
  ```

  Write `(kg) => kg * 1000` or add `return`.
- **`reduce` without a starting value.** On an empty array it throws
  `TypeError: Reduce of empty array with no initial value`. Always pass one.

## Practice

1. Trim each of `["  kale", "beans ", " squash "]` and join them with `", "`.
2. Compute the average of `[12, 18, 9, 21]` with `reduce`, then count the scores above it.
3. Sort `["fig", "banana", "kiwi"]` by length, shortest first, without changing the original.

### Answers

```ts
const raw = ["  kale", "beans ", " squash "];
console.log(raw.map((crop) => crop.trim()).join(", "));
const scores = [12, 18, 9, 21];
const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
console.log(mean, scores.filter((s) => s > mean).length);
const words = ["fig", "banana", "kiwi"];
console.log(words.toSorted((a, b) => a.length - b.length));
```

```text
kale, beans, squash
15 2
[ 'fig', 'kiwi', 'banana' ]
```

## Key takeaways

- `T[]` is an array of `T`; elements are indexed from 0, and `at(-1)` reads the last one.
- `push`, `pop`, `shift` and `unshift` change an array; `map`, `filter`, `reduce`, `find`, `some`
  and `every` read it.
- `find`, `pop` and `shift` may return `undefined`, and their types say so.
- Sort with a comparator, and prefer `toSorted` to the in-place `sort`.
- `readonly T[]` forbids changes; `[A, B]` is a tuple; `...` destructures the rest or spreads
  elements.

## Further reading

- [TypeScript handbook: Object Types, arrays and tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-array-type)
- [MDN: Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN: Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
- [MDN: Array.prototype.toSorted()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
