Write the body of each function. Every tag is a `String`, and the signatures say who owns it:
a function that takes a `String` owns that tag, and the caller only gets it back if the
function returns it.

1. `new_tag(destination: &str) -> String` creates a tag: the text `To: ` (with one space after
   the colon) followed by the destination. The caller owns the new `String`.
2. `mark_fragile(tag: String) -> String` takes ownership of a tag, appends ` [fragile]` (one
   space, then the word in square brackets) and gives the tag back. You may write `mut` in
   front of the parameter name, as the lesson's `add_stamp` does.
3. `copy_tag(tag: String) -> (String, String)` returns two tags with the same text: the one it
   was given, and an independent copy for the desk. Two owners need two values.
4. `prepare(destination: &str, fragile: bool) -> String` creates a tag with `new_tag`. When
   `fragile` is `true` it passes the tag through `mark_fragile`, and otherwise it returns the
   tag as it is.

Example:

```rust
new_tag("LIS")                              // "To: LIS"
mark_fragile(String::from("To: LIS"))       // "To: LIS [fragile]"
copy_tag(String::from("To: OSL"))           // ("To: OSL", "To: OSL")
prepare("OSL", true)                        // "To: OSL [fragile]"
prepare("OSL", false)                       // "To: OSL"
```

**Tip:** if the compiler reports `E0382`, a tag was used after it had moved. The message marks
where it moved, and the fix is to decide which variable should own the tag from then on.
