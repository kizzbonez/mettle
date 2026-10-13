The types are declared in the starter. Do not change their names, fields or `derive` lines:
the tests build them and compare them with `==`. The log arrives as a `&str` parameter, so
there is no standard input to read. No function may panic, whatever the text.

1. `parse_watering(line: &str) -> Result<Watering, LogError>` parses one line of the form
   `PLANT = MILLILITERS`.
   - Split the line at its first `=`. Without one, return `LogError::MissingEquals`.
   - Trim the plant. If it is empty, return `LogError::EmptyPlant`.
   - Trim the amount. It must be a whole number from 1 to `u32::MAX`. Zero, a negative
     number, a decimal or any other text is `LogError::BadAmount(amount)`, where `amount` is
     the trimmed text as a `String`.
   - Make the checks in this order and return the first error.
2. `parse_log(text: &str) -> Result<Vec<Watering>, (usize, LogError)>` parses a whole log.
   - Lines are numbered from 1.
   - Skip lines that are empty or hold only whitespace. Skipped lines still count when
     numbering.
   - Stop at the first line that fails and return its number together with its error.
   - A log without any watering is valid: return an empty `Vec`.
3. `total_for(waterings: &[Watering], plant: &str) -> u32` adds up the milliliters of every
   watering whose plant is exactly `plant`. A plant that never appears has a total of `0`. The
   tests keep the totals small enough for a `u32`.

Example:

```rust
let log = "basil = 250\n\ntomato = 1200\nbasil=150\n";
let waterings = parse_log(log).unwrap();

assert_eq!(waterings.len(), 3);
assert_eq!(waterings[1], Watering { plant: "tomato".to_string(), milliliters: 1200 });
assert_eq!(total_for(&waterings, "basil"), 400);

assert_eq!(
    parse_log("basil = 250\n\nmint = a lot\n"),
    Err((3, LogError::BadAmount("a lot".to_string())))
);
```
