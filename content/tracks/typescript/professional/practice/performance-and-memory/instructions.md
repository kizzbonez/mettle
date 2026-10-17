Keep the types as they are. Nothing here is judged by a clock: the tests check results, ask V8
about the shape of your loans, count the entries your cache holds and the loads it saves, and
give `mostBorrowed` lists so large that only a version doing one pass finishes within the
5 second limit, with a wide margin.

1. **`makeLoan(input: LoanInput): Loan`** returns a plain object with **exactly** the six fields
   of `Loan`, always assigned in the order `id`, `title`, `member`, `dueDay`, `renewals`,
   `note`, whatever order or extra properties the input has. `renewals` is `0` when the input
   has none; `note` is `undefined` when the input has none, but the field is still there. A
   test asks V8 itself whether all loans share one hidden class.
2. **`mostBorrowed(titles: readonly string[]): string | undefined`** returns the title that
   appears most often, or `undefined` for an empty list. When several titles share the highest
   count, return the one whose first appearance comes earliest. The starter's version is
   correct but counts every title with a pass over the whole list; a year of loans (hundreds of
   thousands) must take one pass.
3. **`createLruCache<V>(limit: number): LruCache<V>`** (`limit` is at least 1) keeps at most
   `limit` entries:
   - `set(key, value)` stores the value (replacing an old one) and makes the key the most
     recently used; if the cache then holds more than `limit` entries, it deletes the least
     recently used one.
   - `get(key)` returns the value, or `undefined` when the key is not cached; a hit makes the key
     the most recently used.
   - `size` is the number of entries, and `keys()` lists them from least to most recently used.

   A test replays the pattern that leaked, tens of thousands of lookups by request ids that
   never repeat, and checks that the cache stays at its limit.

Example:

```ts
makeLoan({ title: "Middlemarch", id: "L-1", member: "M-77", dueDay: 12 })
// { id: "L-1", title: "Middlemarch", member: "M-77", dueDay: 12, renewals: 0, note: undefined }
Object.keys(makeLoan({ id: "L-2", title: "Beloved", member: "M-3", dueDay: 9, note: "torn cover" }))
// ["id", "title", "member", "dueDay", "renewals", "note"]

mostBorrowed(["Beloved", "Dune", "Dune", "Beloved", "Emma"])   // "Beloved": tied with Dune, seen first
mostBorrowed([])                                               // undefined

const cache = createLruCache<string>(2);
cache.set("isbn-1", "Dune");
cache.set("isbn-2", "Emma");
cache.get("isbn-1");          // "Dune", and isbn-1 is now the most recently used
cache.set("isbn-3", "Kim");   // the cache is over its limit: isbn-2 is dropped
cache.keys()                  // ["isbn-1", "isbn-3"]
cache.get("isbn-2")           // undefined
cache.size                    // 2
```

**Tip:** a `Map` remembers the order keys were inserted, so deleting a key and setting it again
moves it to the end, and `map.keys().next().value` is the oldest key, found without copying
anything.
