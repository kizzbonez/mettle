Write the body of each function. The signatures are in the starter and must stay as they are,
including the word `pub`, which lets the tests call the functions. Every body can be a single
expression. A semicolon after it would turn it into a statement, and the function would return
`()` instead of a value.

1. `total_minutes(hours: u32, minutes: u32) -> u32` turns hours and minutes into minutes.
2. `scaled_grams(grams: u32, from_servings: u32, to_servings: u32) -> u32` scales an amount
   from one number of servings to another. Multiply by `to_servings` first, then divide by
   `from_servings`. Both steps are integer arithmetic, so the fraction of the result is
   dropped. `from_servings` is never 0.
3. `needs_second_tray(cookies: u32) -> bool` is `true` when the cookies do not fit on one
   tray. A tray holds 12, and the starter has that number as the constant `COOKIES_PER_TRAY`.
4. `ready_in(prep_hours: u32, prep_minutes: u32, baking_minutes: u32) -> u32` is the number of
   minutes until the food is ready: the preparation time plus the baking time. Call
   `total_minutes` for the preparation time instead of repeating its calculation.

Example:

```rust
total_minutes(1, 30)       // 90
scaled_grams(125, 4, 6)    // 187, because 125 * 6 / 4 is 187.5 and the fraction is dropped
needs_second_tray(12)      // false
needs_second_tray(13)      // true
ready_in(1, 30, 25)        // 115
```
