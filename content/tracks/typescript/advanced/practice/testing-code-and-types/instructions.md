This time you write the tests, not the code. `solution.ts` starts with two working functions,
`fare` and `bookRide`: read their comments and do not change them. Below them are two objects of
checks with one check each. Add checks until they cover every rule listed here, using
`node:assert/strict` and, for `bookRide`, `mock.fn` from `node:test`.

**How it is judged.** Each check is a function that receives the function to test as its
parameter (`(fare) => ...`), like the body of a `test(...)` call; call that parameter, not the
module's own function. The lab runs every check against the correct functions, where all must
pass, and against broken versions, each with one of the mistakes below, where at least one check
must fail. It also runs them against correct versions written differently, so check only what
the rules say: the class of an error, not its wording, except for the `no driver` message. Always
`await` an async assertion such as `assert.rejects`.

1. `fareChecks` checks `fare(km, night)`, a price in cents:
   - a ride costs `300` plus `150` for every **started** kilometre: `0` km costs `300`, `1` km
     `450`, and `2.2` km is charged as 3 km, `750`;
   - at night the price is 25% higher, **rounded up** to a whole cent: `1` km at night is `563`,
     from `562.5`;
   - a negative distance throws a `RangeError` (`assert.throws`), while `0` km is a valid ride.
2. `bookingChecks` checks `bookRide(dispatch, area, attempts)` with a mock as `dispatch`:
   - it calls `dispatch` with the `area` it was given and returns the driver from the first
     answer, calling `dispatch` only once when that answer succeeds;
   - when an answer rejects, it asks again, up to `attempts` times in all: a rejection followed by
     a success returns that driver after two calls (`mock.mockImplementationOnce` makes one call
     differ);
   - when every attempt fails, `dispatch` has been called exactly `attempts` times and the
     promise rejects with an `Error` whose message is `` `no driver after ${attempts} attempts` ``
     and whose `cause` is the **last** rejection;
   - `attempts` below 1 rejects with a `RangeError` without calling `dispatch` at all.
3. **`Equal<A, B>`** is the type equality check from the lesson: `true` only when the two types
   are identical. The starter's version wrongly treats `any` as equal to every type and ignores
   `readonly`; the hidden tests check yours on such pairs.

**Example.** If someone deleted the night surcharge, this check fails, because `fare(1, true)`
would be `450`:

```ts
"a night ride costs 25% more, rounded up": (fare) => {
  assert.equal(fare(1, true), 563);
},
```

`assert.rejects` takes a function that validates the error, which suits checking a `cause`:

```ts
await assert.rejects(bookRide(dispatch, "harbour", 2), (error: Error) => {
  assert.equal(error.cause, secondFailure);
  return true;
});
```

The visible test runs your checks against the correct functions, a `fare` without the night
surcharge and a `bookRide` that never asks twice. The hidden tests use the other mistakes and
the `Equal` type.
