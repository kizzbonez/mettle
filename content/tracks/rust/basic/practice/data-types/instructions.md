Each function in the starter is nearly complete. Write only where a comment says `YOUR CODE`,
and keep the last line of each function, which hands the result to the tests. The names in the
parentheses are variables that the tests fill in, and the type after each colon says what they
hold.

1. `hours_and_minutes(total_minutes: u32) -> (u32, u32)` splits minutes of sunshine into whole
   hours and the minutes left over. The result is a tuple with the hours first.
2. `add_rain(gauge: u8, extra: u8) -> u8` adds millimeters of rain to the gauge. The gauge
   cannot show more than 255, so a sum above that is 255. It must neither panic nor wrap
   around.
3. `average_temperature(readings: [i32; 3]) -> f64` is the average of the three readings, with
   its fraction.
4. `temperature_span(day: (f64, f64)) -> i32` takes the lowest and the highest temperature of a
   day, in that order, and gives the whole degrees between them: subtract, then drop the
   fraction, so that 2.75 becomes 2. The highest is never below the lowest.

Example:

```rust
hours_and_minutes(135)              // (2, 15)
add_rain(10, 20)                    // 30
add_rain(250, 10)                   // 255
average_temperature([18, 20, 21])   // 19.666..., not 19.0
temperature_span((-3.5, 4.0))       // 7
```

**Tip:** the starter of `add_rain` uses `+`. Once task 1 is done, press **Run** before you
change it and read how the test stops: `attempt to add with overflow` is the panic from the
lesson.
