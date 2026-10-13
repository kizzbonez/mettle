Complete the `Rental` struct and its `impl` block. Keep the `derive` line and the signatures as
they are: the tests print a rental with `{:?}`, compare rentals with `==` and call every
function below.

1. Give `Rental` two fields, in this order: `rider`, a `String`, and `hours`, a `u32`.
2. `Rental::new(rider: &str, hours: u32) -> Self` is an associated function that builds a
   rental. The rental owns its rider's name.
3. `price_cents(&self) -> u32` is the price so far: 300 cents to unlock the bike, plus 450
   cents for every hour.
4. `extend(&mut self, extra_hours: u32)` adds hours to the rental.
5. `into_receipt(self) -> String` consumes the rental and returns its receipt line: the rider,
   a colon and a space, the hours followed by ` h`, a comma and a space, then the price
   followed by ` cents`.

Example:

```rust
let mut rental = Rental::new("Ada", 2);
println!("{rental:?}");        // Rental { rider: "Ada", hours: 2 }
rental.price_cents()           // 1200
rental.extend(1);
rental.price_cents()           // 1650
rental.into_receipt()          // "Ada: 3 h, 1650 cents"
```
