Write `solution.rs`. The types are declared in the starter. Do not change their names, fields or
`derive` lines: the tests build them and compare them with `==`.

1. `parse_movement(line: &str) -> Result<Movement, ParseError>` parses one line of the form
   `SKU,KIND,QUANTITY`.
   - Split the line on `,` and trim the whitespace around every field.
   - If there are not exactly three fields, return `ParseError::WrongFieldCount(n)`, where `n`
     is the number of fields you found. A line with no comma, even an empty one, is one field.
   - **SKU**: 3 to 12 characters, each one an ASCII uppercase letter, an ASCII digit or `-`.
     Otherwise return `ParseError::InvalidSku(field)`.
   - **KIND**: `IN` is `Kind::Inbound` and `OUT` is `Kind::Outbound`. Anything else, including
     `in` or `Out`, is `ParseError::UnknownKind(field)`.
   - **QUANTITY**: a whole number from 1 to `u32::MAX`. Zero, negative numbers, decimals and
     text are `ParseError::InvalidQuantity(field)`.
   - Check the field count first, then the fields from left to right, and return the first
     error. The `String` inside an error is the offending field after trimming.
2. `parse_ledger(text: &str) -> Result<Vec<Movement>, LineError>` parses a whole upload.
   - Lines are numbered from 1.
   - Skip lines that are empty or contain only whitespace, and lines whose first non-whitespace
     character is `#`. Skipped lines still count when numbering.
   - Stop at the first line that fails and return `LineError { line, error }`.
   - An upload with no movements is valid: return an empty `Vec`.
3. `net_quantity(movements: &[Movement], sku: &str) -> i64` returns the inbound quantity minus
   the outbound quantity for one SKU. A SKU that never appears has a net quantity of `0`. The
   result can be negative.

No function may panic, whatever the input.

Example:

```rust
let ledger = "# dock 7, evening shift\nKB-204, IN, 40\nKB-204, OUT, 12\n\nCBL-9, IN, 300\n";
let movements = parse_ledger(ledger).unwrap();

assert_eq!(movements.len(), 3);
assert_eq!(movements[1], Movement { sku: "KB-204".to_string(), kind: Kind::Outbound, quantity: 12 });
assert_eq!(net_quantity(&movements, "KB-204"), 28);

assert_eq!(
    parse_movement("KB-204, OUT, 1 2"),
    Err(ParseError::InvalidQuantity("1 2".to_string()))
);
```

**Tip:** a comment line may contain commas. Decide whether a line is skipped before you split
it.
