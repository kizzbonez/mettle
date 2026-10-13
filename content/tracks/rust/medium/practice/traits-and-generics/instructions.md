The traits, the two structs and every signature are in the starter. Write the bodies, and add
what the `TODO` comments ask for. The tests also bring ticket types of their own, so every
function must work for any type that implements the trait.

1. **`Ticket`** has one required method, `zones(&self) -> u32`. Write its two default methods.
   - `price_cents(&self) -> u32` is 150 cents to board plus 80 cents for every zone.
   - `label(&self) -> String` is the zones, then `-zone ticket, `, then the price, then
     ` cents`. It asks `price_cents()` for the price instead of repeating the sum, so a type
     with a price of its own gets the right label.
2. Implement `Ticket` for the two structs.
   - `Single` covers the number of zones in its field `zones` and keeps both defaults.
   - `DayPass` covers 4 zones and replaces the default price: it costs 900 cents.
3. `total_cents<T>(tickets: &[T]) -> u32` adds up the prices of a slice of tickets of one
   type. The starter leaves the bound out. Add it.
4. `pass_pays_off<P, S>(pass: &P, single: &S, rides: u32) -> bool` takes two tickets that may
   be of different types. It is `true` when the pass costs less than `rides` times the
   single ticket, and `false` when it costs the same or more. Add the two bounds in the
   spelling you prefer: `P: Ticket`, `&impl Ticket` or a `where` clause.
5. **`Refundable`** is for tickets that can be handed back. Make `Ticket` its supertrait, so
   that the default method can ask for the price.
   - `refund_cents(&self) -> u32` is `0` for a used ticket. For an unused one it is the price
     minus a fee of 100 cents.
   - Implement `used` for `Single`: it returns the field `used`.

Example:

```rust
let single = Single { zones: 2, used: false };
single.price_cents()                  // 310, which is 150 + 2 * 80
single.label()                        // "2-zone ticket, 310 cents"
DayPass.price_cents()                 // 900
DayPass.label()                       // "4-zone ticket, 900 cents"

total_cents(&[Single { zones: 1, used: false }, Single { zones: 3, used: true }])   // 620
pass_pays_off(&DayPass, &single, 3)   // true: 900 is less than 930
pass_pays_off(&DayPass, &single, 2)   // false: 900 is more than 620
single.refund_cents()                 // 210
```
