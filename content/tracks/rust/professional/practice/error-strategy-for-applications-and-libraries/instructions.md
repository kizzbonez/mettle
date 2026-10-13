The two error types and `parse_line` are in the starter. Write the six bodies marked `TODO`,
and keep the types and signatures as they are. There are no crates here, so this is the code
that `thiserror` and `anyhow` would otherwise generate for you.

1. `Display` for `LineError` is the message for people, in lower case and without a full
   stop:
   - `MissingField(name)` writes `missing <name> field`, for example `missing amount field`;
   - `BadAmount(_)` writes `amount is not a whole number of cents`, and nothing about its
     cause.
2. `Error::source` for `LineError` returns the `ParseIntError` inside `BadAmount`, and `None`
   for `MissingField`. A cause belongs in `source` or in the `Display` text, never in both.
3. `From<ParseIntError>` for `LineError` wraps the cause in `BadAmount`. The `?` in
   `parse_line` calls it.
4. `ImportError` is the context that the importer adds. Its `Display` writes
   `cannot import line <n>`, and its `source` is the `LineError` it wraps.
5. `import_total(text: &str) -> Result<u64, ImportError>` adds up the amounts of all lines.
   - A line that is empty, or holds only whitespace, is skipped.
   - Every other line goes to `parse_line`. The first one that fails ends the import with an
     `ImportError` that holds the line's number and the `LineError` as its source.
   - Lines are numbered from 1, and a skipped line still counts.
6. `report(error: &(dyn Error + 'static)) -> String` describes an error and every cause
   behind it, outermost first. The first line is `error: ` followed by the error. Each cause
   follows on a line of its own: two spaces, `caused by: ` and the cause. The lines are
   joined with `\n`, and there is no line break after the last one.

`report` must work for any error, not only for the two types of this lab: it follows
`source()` until that returns `None`.

Example:

```rust
import_total("rent;120000\ncoffee;450")        // Ok(120450)

// Line 2 is blank and line 3 has a letter in its amount.
let error = import_total("rent;120000\n\ncoffee;4x0\n").unwrap_err();
error.line()                                   // 3
report(&error)
// error: cannot import line 3
//   caused by: amount is not a whole number of cents
//   caused by: invalid digit found in string

let error = import_total("rent").unwrap_err();
report(&error)
// error: cannot import line 1
//   caused by: missing amount field
```

The last line of the first report is the standard library's own message for the
`ParseIntError`. It appears once, because the `Display` of `BadAmount` left it out.
