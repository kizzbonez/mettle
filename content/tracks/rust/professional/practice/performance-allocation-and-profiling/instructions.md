The starter has two things ready: `allocations`, which counts how often a piece of code asks
the allocator for memory, and the three functions that production runs today. Those are
correct. Leave them as they are, and use them to check your results and to see what you save.

Write the three replacements. **No test measures time.** The cost that is checked is the
number of allocations.

1. `join_ids(ids: &[u32]) -> String` writes the ids in decimal with a comma between them,
   exactly as `join_ids_before` does. It makes **at most one allocation**, however many ids
   there are and however many digits they have.
2. `clean_sku(sku: &str) -> Cow<'_, str>` removes the whitespace around a SKU and changes its
   ASCII letters to upper case, exactly as `clean_sku_before` does. Letters outside ASCII
   stay as they are.
   - If the trimmed text has no lower-case ASCII letter, return it as `Cow::Borrowed`:
     **no allocation**.
   - Otherwise return the new text as `Cow::Owned`, made with **at most one allocation**.
3. `write_line(line: &mut String, order: u32, sku: &str, quantity: u32)` replaces the content
   of `line` with `order=<order> sku=<sku> qty=<quantity>`, the text that `line_before`
   returns. It keeps the caller's buffer: when the capacity of `line` is large enough for the
   new text, it makes **no allocation**.

How the counting works: every request for memory counts once, and so does every time a
`String` or `Vec` outgrows its buffer and has to move to a larger one. Giving memory back
counts for nothing.

Example:

```rust
use std::borrow::Cow;

let ids = [7, 42, 1000];
let mut joined = String::new();
allocations(|| joined = join_ids_before(&ids))   // 5
allocations(|| joined = join_ids(&ids))          // 1
joined                                           // "7,42,1000"

clean_sku("AB-12")                               // Cow::Borrowed("AB-12"), no allocation
clean_sku(" ab-12 ")                             // Cow::Owned("AB-12"), one allocation

let mut line = String::with_capacity(64);
write_line(&mut line, 9001, "AB-12", 3);         // line is "order=9001 sku=AB-12 qty=3"
write_line(&mut line, 9002, "ZX-7", 10);         // line is "order=9002 sku=ZX-7 qty=10"
                                                 // and the second call allocated nothing
```

**Tips**

- A `u32` has at most 10 digits.
- To find out whether a SKU has to change, look at its bytes with `is_ascii_lowercase`.
  Building the upper-case text only to compare it with the input is the allocation you are
  trying to avoid.
- `write!(buffer, "{value}")` appends to a `String` without building another `String` first.
  It needs `use std::fmt::Write`, which is already in the starter, and it returns a `Result`
  that cannot be an error for a `String`.
- Measure before you change anything: wrap a call of a `_before` function in `allocations`
  and look at the number.
