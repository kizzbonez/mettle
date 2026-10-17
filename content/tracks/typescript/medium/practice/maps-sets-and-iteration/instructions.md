Write the five functions in `solution.ts`; their signatures are in the starter. No function
changes the maps, sets or arrays it is given.

1. **`tally(sightings: readonly string[]): Map<string, number>`** counts how often each species
   appears, with the keys in the order each species was first seen.
2. **`newForTheYear(yearList: ReadonlySet<string>, walk: Iterable<string>): Set<string>`**
   returns the species on the walk that are not on the year list, using an ES2025 set method.
   `walk` may be any iterable: an array, a set, a generator.
3. **`seenOnEveryWalk(walks: readonly ReadonlySet<string>[]): Set<string>`** returns the species
   that appear in every one of the sets, using `intersection`. With no walks at all, it returns
   an empty set; with one walk, a new set with that walk's species.
4. **`ringNumbers(prefix: string, first: number): Generator<string>`**, a generator function,
   yields ring numbers without end: the prefix, a `-`, and the number padded to four digits,
   starting at `first`. Nothing may be computed before it is asked for.
5. **`rareSpecies(counts: ReadonlyMap<string, number>, limit: number): string[]`** returns the
   species counted exactly once, in the map's order, at most `limit` of them. Chain the iterator
   helpers on `counts.entries()`: `filter`, `map`, `take` and `toArray`.

Example:

```ts
const walk = ["robin", "wren", "robin", "jay", "heron", "robin", "wren"];
[...tally(walk)]                       // [["robin", 3], ["wren", 2], ["jay", 1], ["heron", 1]]
newForTheYear(new Set(["robin", "jay", "blackbird"]), walk)   // Set { "wren", "heron" }
seenOnEveryWalk([new Set(["robin", "jay"]), new Set(["jay", "wren", "robin"])])
                                       // Set { "robin", "jay" }
ringNumbers("NL", 41).take(3).toArray()   // ["NL-0041", "NL-0042", "NL-0043"]
rareSpecies(tally(walk), 5)            // ["jay", "heron"]
```
