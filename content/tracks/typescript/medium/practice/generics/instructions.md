Replace every `any` in the starter's code with generics, then write the bodies. Some tests check
your **types**: lines the compiler must reject are marked `// @ts-expect-error`, so a signature
that still accepts anything fails a test.

1. **`Page<T>`**, a generic interface: `items: T[]`, `page: number` and `totalPages: number`.
2. **`paginate<T>(items: readonly T[], perPage: number, page: number): Page<T>`** returns one
   page of the items. Pages count from 1, `totalPages` is `Math.ceil(items.length / perPage)`,
   and a page past the end has no items. The input array is not changed.
3. **`playableWith`** returns the games whose `minPlayers` to `maxPlayers` range includes
   `players` (both ends count), in their original order. Constrain its type parameter, so that it
   accepts any objects with those two numbers and returns the caller's own type:

   ```ts
   export function playableWith<T extends { minPlayers: number; maxPlayers: number }>(games: readonly T[], players: number): T[]
   ```

4. **`Waitlist<T = string>`**, a generic class whose type parameter defaults to `string`, so
   `new Waitlist()` holds party names. Keep the entries in a `#private` array.
   - `add(entry: T): number` puts the entry at the end of the line and returns its position
     (1 for the first in line).
   - `next(): T | undefined` removes and returns the first entry, `undefined` when empty.
   - `peek(): T | undefined` returns the first entry without removing it.
   - `get size(): number` is the number of entries waiting.

Example:

```ts
const games = [
  { title: "Carcassonne", minPlayers: 2, maxPlayers: 5 },
  { title: "Patchwork", minPlayers: 2, maxPlayers: 2 },
  { title: "Wingspan", minPlayers: 1, maxPlayers: 5 },
];
playableWith(games, 4).map((game) => game.title)   // ["Carcassonne", "Wingspan"]
paginate(games, 2, 2)                               // { items: [the Wingspan object], page: 2, totalPages: 2 }

const tables = new Waitlist();                      // a Waitlist<string>
tables.add("Okafor")                                // 1
tables.add("Lund")                                  // 2
tables.next()                                       // "Okafor"
tables.size                                         // 1
tables.add(4)                                       // compile error: a number is not a string
```
