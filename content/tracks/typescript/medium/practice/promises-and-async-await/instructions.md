Write the four functions. The tests give you fake branches whose answers they release one at a
time, in any order, so the functions must ask **every** branch before awaiting any answer, as the
lesson's `Promise.all(ids.map(load))` does. An `await` inside a loop asks one branch at a time and
fails the tests.

1. **`totalCopies(branches: readonly Branch[], title: string): Promise<number>`** adds up the
   copies at every branch, with `Promise.all`. If any branch rejects, it rejects too.
2. **`shelfReport(branches: readonly Branch[], title: string): Promise<string[]>`** returns one
   line per branch, in the order of `branches` whatever order the answers arrive in:
   `<name>: <copies>`, or `<name>: offline` for a branch that rejected. Use `Promise.allSettled`;
   it never rejects.
3. **`firstWithCopy(branches: readonly Branch[], title: string): Promise<string>`** resolves with
   the name of the first branch to answer with at least one copy. A branch that answers 0, or
   rejects, does not count. Use `Promise.any`: when no branch counts, it rejects with its
   `AggregateError`.
4. **`withDeadline<T>(work: Promise<T>, deadline: Promise<void>): Promise<T>`** settles like
   `work` if `work` settles first, with its value or its error. If `deadline` resolves first, it
   rejects with an `Error` whose message is `deadline passed`. Use `Promise.race`.

Example (with branches that answer at once):

```ts
// Central has 4 copies of "Dune", Harbour has 0, Hillside is offline.
await totalCopies([central, harbour], "Dune")              // 4
await totalCopies([central, hillside], "Dune")             // rejects: Hillside is offline
await shelfReport([central, harbour, hillside], "Dune")    // ["Central: 4", "Harbour: 0", "Hillside: offline"]
await firstWithCopy([harbour, hillside, central], "Dune")  // "Central"
await withDeadline(central.copiesOf("Dune"), new Promise(() => {}))   // 4: this deadline never comes
```
