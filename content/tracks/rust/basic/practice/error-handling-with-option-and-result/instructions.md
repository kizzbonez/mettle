The `AgeError` enum is declared in the starter. Do not change it or its `derive` line: the
tests compare errors with `==`. Write the three functions. A text that is wrong must never
make them panic: it is reported through the `Result` or the `Option`.

1. `parse_age(text: &str) -> Result<u8, AgeError>` reads a runner's age.
   - Trim the text first.
   - If nothing is left, return `AgeError::Missing`.
   - If the rest does not parse as a `u8`, return `AgeError::NotANumber(text)`, where `text`
     is the trimmed text as a `String`.
   - If the age is below 18, return `AgeError::TooYoung(age)`.
   - Otherwise return the age. Make the checks in this order.
2. `entry_fee(age_text: &str) -> Result<u32, AgeError>` is the entry fee in cents: `2000` for
   runners aged 60 or older and `3500` for everyone else. It calls `parse_age` and passes any
   error on to its own caller unchanged, which is a job for `?`.
3. `finish_minutes(time: &str) -> Option<u32>` turns a finishing time written as
   `HOURS:MINUTES`, such as `3:45`, into minutes. Split the text at its first colon. Return
   `None` when there is no colon, when either part does not parse as a `u32`, or when the
   minutes part is 60 or more. The tests keep the hours small, so the result always fits in a
   `u32`.

Example:

```rust
parse_age(" 42 ")         // Ok(42)
parse_age("")             // Err(AgeError::Missing)
parse_age("forty")        // Err(AgeError::NotANumber("forty".to_string()))
parse_age("16")           // Err(AgeError::TooYoung(16))
entry_fee("61")           // Ok(2000)
entry_fee("16")           // Err(AgeError::TooYoung(16))
finish_minutes("3:45")    // Some(225)
finish_minutes("3h45")    // None
```
