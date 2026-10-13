Write the body of each function. Every parameter is a `&str`, so the functions only borrow the
text they read. Do not change the signatures.

1. `badge_line(name: &str, company: &str) -> String` builds the line printed on a badge: the
   name in upper case, a comma and a space, then the company. Trim the whitespace from both
   ends of the name and of the company first. The company keeps its upper and lower case.
2. `letter_count(name: &str) -> usize` is the number of characters in the name that are not
   spaces. Count characters, not bytes: `Zoë` has three.
3. `ticket_kind(code: &str) -> &str` returns the kind of a ticket as a slice of its code. A
   code is three ASCII letters, a dash and a number, such as `VIP-0042`, and the kind is the
   three letters. The tests only pass codes of that shape.
4. `count_sessions(list: &str) -> usize` receives the sessions a visitor chose, separated by
   commas, and counts them. An entry that is empty once it is trimmed does not count.

Example:

```rust
badge_line("  ada lovelace ", " Analytical Engines ")   // "ADA LOVELACE, Analytical Engines"
letter_count("Ada Lovelace")                            // 11
ticket_kind("VIP-0042")                                 // "VIP"
count_sessions("rust, wasm, , testing")                 // 3
```
