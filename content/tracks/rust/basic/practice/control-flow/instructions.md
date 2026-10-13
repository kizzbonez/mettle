Write the body of each function. The signatures are in the starter and must stay as they are.

1. `entry_price(age: u32) -> u32` is the price of a ticket in cents:
   - younger than 5: `0`
   - 5 to 15, both included: `300`
   - 65 and older: `350`
   - everyone else: `600`
2. `busy_lanes(swimmers: [u32; 6]) -> u32` receives the number of swimmers in each of the six
   lanes and counts the lanes that are busy. A lane is busy when it has more than 4 swimmers.
3. `pyramid_lengths(top: u32) -> u32` is the length of a training set that goes 1 length, then
   2, then 3, and so on up to `top` lengths: the sum of the whole numbers from 1 to `top`,
   with `top` included. For a `top` of 0 the sum is 0.
4. `hours_to_fill(depth: u32, target: u32) -> u32` is about refilling the pool. The water is
   `depth` centimeters deep now and rises 15 centimeters every hour. Return the number of
   whole hours until the depth is at least `target`. If it already is, the answer is `0`.

Example:

```rust
entry_price(4)                      // 0
entry_price(10)                     // 300
entry_price(30)                     // 600
entry_price(70)                     // 350
busy_lanes([2, 5, 0, 7, 4, 9])      // 3
pyramid_lengths(4)                  // 10, which is 1 + 2 + 3 + 4
hours_to_fill(40, 100)              // 4, because the depth goes 55, 70, 85, 100
```

**Tip:** a parameter cannot be changed. To count the depth upwards, start a mutable variable of
your own from it.
