The enum `Trip` and the struct `Ride` are declared in the starter. Do not change them. Write
the three functions, each as a single `match` whose arms take the value apart. Arms are tried
from top to bottom, so put the specific ones first.

1. `fare_cents(trip: &Trip) -> u32` is the price of a trip in cents.
   - `Trip::City { km }`: `0` for 0 kilometers, `600` for 1 to 3 kilometers, and for a longer
     trip `600` plus `150` for every kilometer after the third.
   - `Trip::Airport { terminal, bags }`: `3500` to terminal 1 or 2 and `4200` to any other
     terminal, plus `100` for every bag.
   - `Trip::Waiting(minutes)`: the first 5 minutes are free. From 6 to 60 minutes the price
     is `50` for every minute after the fifth. The meter stops there: a longer wait costs
     what 60 minutes cost, `2750`.
2. `route(stops: &[&str]) -> String` names a route from its stops, in driving order.
   - no stops: `no stops`
   - one stop: `stay at ` and the stop
   - two stops: the first, ` to `, the second, then `, direct`
   - more: the first, ` to `, the last, a comma and a space, the number of stops between
     them, then ` in between`
3. `describe(ride: &Ride) -> String` is the line for the driver's log. Use the first rule that
   applies. `ID` stands for the ride's `id`.
   - a ride with the id `0`: `test ride`
   - an airport trip: `#ID airport, terminal ` and the terminal
   - a tip of 500 cents or more: `#ID with a generous tip`
   - any other tip, whatever its amount: `#ID with a tip`
   - no tip: `#ID`

Example:

```rust
fare_cents(&Trip::City { km: 2 })                      // 600
fare_cents(&Trip::City { km: 10 })                     // 1650, which is 600 + 7 * 150
fare_cents(&Trip::Airport { terminal: 2, bags: 3 })    // 3800
fare_cents(&Trip::Airport { terminal: 5, bags: 0 })    // 4200
fare_cents(&Trip::Waiting(12))                         // 350

route(&[])                                             // "no stops"
route(&["Mill Lane"])                                  // "stay at Mill Lane"
route(&["Mill Lane", "Quay"])                          // "Mill Lane to Quay, direct"
route(&["Mill Lane", "Park", "Zoo", "Quay"])           // "Mill Lane to Quay, 2 in between"

describe(&Ride { id: 7, trip: Trip::City { km: 2 }, tip: Some(650) })
// "#7 with a generous tip"
describe(&Ride { id: 8, trip: Trip::Airport { terminal: 2, bags: 1 }, tip: Some(650) })
// "#8 airport, terminal 2"
```
