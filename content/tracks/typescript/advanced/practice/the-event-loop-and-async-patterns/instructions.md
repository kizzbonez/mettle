Write the bodies of two async functions in `solution.ts`; keep their signatures. The tests
control every wash with promises they resolve themselves and wait with `setImmediate`, so
nothing depends on timing.

1. **`washAll(loads, machines, wash, signal?)`** washes every load with `wash(load)` and resolves
   with the results **in the order of `loads`**, whatever order the washes finish in.
   - At most `machines` washes run at once, and a new one starts as soon as one finishes: start
     `machines` workers that each take the next load until none are left, as the lesson's
     worker pool does. Loads start in their list order.
   - `machines` must be a whole number of at least 1; otherwise `washAll` rejects with a
     `RangeError` and calls `wash` for nothing. An empty list resolves with `[]`.
   - If a wash rejects, `washAll` rejects with that error.
   - `signal` is optional. If it is already aborted when `washAll` is called, `washAll` rejects
     with `signal.reason` without starting a wash. Check it again before starting each load:
     once it is aborted, no new load starts, and `washAll` rejects with `signal.reason`. Washes
     already running are not interrupted (cancellation is cooperative).
2. **`bundles(source, size)`** is an async generator that reads any async iterable and yields its
   items in arrays of `size`, in order; the last bundle holds whatever is left and may be smaller,
   and an empty bundle is never yielded. It pulls items only as it needs them: when a consumer
   stops after the first bundle, no further item has been taken from `source`, and leaving with
   `break` closes `source` too (`for await` does this for you). A `size` that is not a whole
   number of at least 1 throws a `RangeError` when the first bundle is asked for, before
   anything is read.

Example:

```ts
const results = await washAll(["towels", "jeans", "sheets"], 2, async (load) => `${load} clean`);
// ["towels clean", "jeans clean", "sheets clean"]; at most two washes ran at once

async function* foldingTable() {
  yield "shirt"; yield "sock"; yield "scarf"; yield "sock"; yield "cap";
}
for await (const bag of bundles(foldingTable(), 2)) console.log(bag);
// [ 'shirt', 'sock' ]
// [ 'scarf', 'sock' ]
// [ 'cap' ]
```
