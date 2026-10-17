The starter's three functions compile, but their **types are too loose**: hidden tests check
the types with `@ts-expect-error` lines and exact type comparisons, so fix the signatures as well
as writing the bodies. `Bike` is complete.

1. **`groupBy(items, key)`** returns a `Map` from each value found at `key` to the items that
   have it, with the keys in the order they first appear and the items in their original order.
   Make `key` a type parameter constrained by the item type, so a key that items do not have is
   rejected, and give the result the type `Map<T[K], T[]>`: grouping bikes by `"size"` returns a
   `Map<"S" | "M" | "L", Bike[]>`, and grouping them by `"electric"` a `Map<boolean, Bike[]>`.
2. **`pickOr(choices, requested, fallback)`** returns `requested` when it is one of `choices`
   (compared exactly) and `fallback` otherwise, including when `requested` is `undefined`. The
   result has the type of the choices, such as `"S" | "M"`. `fallback` must be one of the choices
   too: `pickOr(["S", "M"], "L", "XL")` must not compile. Stop `fallback` from being an
   inference candidate.
3. **`tourStops(stops)`** returns the stops it was given. Called with an array literal, the result
   keeps the literal tuple type, `readonly ["Harbour", "Old Mill"]` for `["Harbour", "Old Mill"]`,
   without the caller writing `as const`. When a stop appears twice, it throws an `Error` with the
   message `` stop "NAME" appears twice ``, naming the first stop, reading from the start, that
   repeats an earlier one.

Example:

```ts
const fleet: Bike[] = [
  { id: "b1", size: "M", electric: false, dailyRate: 18 },
  { id: "b2", size: "L", electric: true, dailyRate: 35 },
  { id: "b3", size: "M", electric: true, dailyRate: 32 },
];

groupBy(fleet, "size");                   // Map { "M" => [b1, b3], "L" => [b2] }
groupBy(fleet, "colour");                 // compile error: Bike has no colour
pickOr(["S", "M", "L"], "XL", "M");       // "M"
const tour = tourStops(["Harbour", "Old Mill", "Lighthouse"]);
tour[3];                                  // compile error: the tuple has three stops
tourStops(["Harbour", "Pier", "Harbour"]); // throws: stop "Harbour" appears twice
```
