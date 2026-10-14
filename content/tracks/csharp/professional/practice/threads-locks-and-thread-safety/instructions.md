`Station` is written: riders call `TryRent` and `Return` from any thread, and each station guards
its count with its own `Lock`, `Gate`. `Adjust` changes the count and throws if the calling
thread does not hold that station's `Gate`. Leave `Station` as it is.

Write the three members of `Rebalancer`, which every van shares:

1. `bool TryMove(Station from, Station to, int bikes, TimeSpan wait)` moves bikes from one
   station to the other.
   - Throw `ArgumentOutOfRangeException` if `bikes` is less than 1, and `ArgumentException` if
     `from` and `to` have the same `Id`. Do this before taking any lock.
   - Hold **both** stations' `Gate` while you check and move. Take them in one fixed order:
     **the station with the lower `Id` first**, whichever way the bikes go.
   - Take each with `Gate.TryEnter(wait)`. If one is not free within `wait`, give up: release
     what you hold and return `false`.
   - With both held, if `from` has fewer than `bikes` bikes, return `false`. Otherwise call
     `from.Adjust(-bikes)` and `to.Adjust(bikes)` and return `true`.
   - Release every lock you took before you return, on every path. A move that returns
     `false` changes nothing.
2. `long Moves` is the number of moves that returned `true`.
3. `long BikesMoved` is the number of bikes those moves carried.

Several vans call `TryMove` on one `Rebalancer` at the same moment, between different stations,
so the two counters need `Interlocked`; reading them must be safe too.

How it is checked: the tests run moves on other threads and play a rider in the middle of a
rental by holding a station's `Gate` on a thread of their own. They look at which locks are
held while a move waits, and whether any are still held after it returns. Nothing depends on a
race happening by chance.

Example:

```csharp
var depot = new Station(1, bikes: 10);
var park = new Station(2, bikes: 0);
var vans = new Rebalancer();

vans.TryMove(depot, park, 4, TimeSpan.FromSeconds(1))   // true
(depot.Bikes, park.Bikes)                                // (6, 4)
vans.TryMove(park, depot, 5, TimeSpan.FromSeconds(1))   // false: the park has only 4
(vans.Moves, vans.BikesMoved)                            // (1, 4)

// Another thread holds park.Gate: a rider is in the middle of a rental.
vans.TryMove(depot, park, 1, TimeSpan.FromMilliseconds(50))   // false, after 50 ms
(depot.Bikes, park.Bikes)                                      // (6, 4): nothing changed
```

**Tips**

- The lower `Id` first in both directions is what stops two vans on opposite routes from each
  holding the station the other one needs.
- A plain `lock` statement would wait forever for a busy station. `Gate.TryEnter(wait)` returns
  `false` instead, and every successful `TryEnter` needs exactly one `Gate.Exit()`, in a
  `finally` block.
- `Lock` is reentrant: reading `from.Bikes` while you hold `from.Gate` is fine.
- `Interlocked.Increment`, `Interlocked.Add` and `Interlocked.Read` work on `long` fields.
