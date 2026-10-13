The newtype `Seconds`, its `Display` implementation, the struct `Side` and the two traits are
in the starter. Keep the `derive` line, the trait declarations and the `impl` headers, and
complete the four places marked there.

1. `Add for Seconds`: `a + b` is the playing time of both together.
2. `Mul<u32> for Seconds`: `length * times` is the playing time of a track that is repeated
   `times` times. The number is on the right-hand side.
3. `Measure for Side`. The trait has an associated type, `Size`, which each implementor chooses.
   - A side is measured in `Seconds`. Replace the placeholder `()` with that type.
   - `size(&self)` adds up the tracks of the side with the `+` you wrote. A side without
     tracks has the size `Seconds(0)`.
4. `Spine::spine(&self) -> String` is a default method of a trait whose supertrait is
   `fmt::Display`. It returns the text that `{}` prints for the value, with `| ` in front of it
   and ` |` after it. Write it once, in the trait: it then works for `Seconds` and for every
   other type that implements `Spine`.

`Display for Seconds` is given: it prints the minutes, a colon and the seconds with two digits.

Example:

```rust
Seconds(187) + Seconds(255)          // Seconds(442)
Seconds(90) * 3                      // Seconds(270)
Seconds(442).to_string()             // "7:22", which is given

let side = Side(vec![Seconds(187), Seconds(255), Seconds(64)]);
side.size()                          // Seconds(506)
Seconds(506).spine()                 // "| 8:26 |"
```

**Tip:** the tests print `side.size()` with `{:?}`. That compiles for any type you choose as
`Size`, and it shows whether you chose `Seconds`.
