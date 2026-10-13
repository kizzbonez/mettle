fn movement(sku: &str, kind: Kind, quantity: u32) -> Movement {
    Movement { sku: sku.to_string(), kind, quantity }
}

// Valid lines at the edges of the rules.
assert!(
    parse_movement("AB1,IN,1") == Ok(movement("AB1", Kind::Inbound, 1)),
    "a 3-character SKU and a quantity of 1 are valid, with or without spaces"
);
assert!(
    parse_movement("  ZX-99-PALLET ,\tOUT ,  4294967295  ")
        == Ok(movement("ZX-99-PALLET", Kind::Outbound, u32::MAX)),
    "whitespace around every field is trimmed; a 12-character SKU and the largest u32 are valid"
);

// Field count.
assert!(
    parse_movement("") == Err(ParseError::WrongFieldCount(1)),
    "a line without commas has one field"
);
assert!(
    parse_movement("KB-204,IN") == Err(ParseError::WrongFieldCount(2)),
    "a line with too few fields reports how many it had"
);
assert!(
    parse_movement("KB-204,IN,5,") == Err(ParseError::WrongFieldCount(4)),
    "a trailing comma creates one more field"
);
assert!(
    parse_movement("x,sideways,0,extra") == Err(ParseError::WrongFieldCount(4)),
    "the field count is checked before any field is validated"
);

// SKU. The last one contains a non-ASCII uppercase letter.
for bad in ["AB", "ABCDEFGHIJKLM", "kb-204", "KB 204", "KB_204", "", "K\u{c4}-204"] {
    let line = format!(" {bad} ,IN,5");
    assert!(
        parse_movement(&line) == Err(ParseError::InvalidSku(bad.to_string())),
        "a SKU must be 3 to 12 ASCII uppercase letters, digits or '-', and the error carries the trimmed field"
    );
}

// Kind.
for bad in ["in", "Out", "INBOUND", "", "IN OUT"] {
    let line = format!("KB-204, {bad} ,5");
    assert!(
        parse_movement(&line) == Err(ParseError::UnknownKind(bad.to_string())),
        "only IN and OUT, in upper case, are known kinds, and the error carries the trimmed field"
    );
}

// Quantity.
for bad in ["0", "-3", "2.5", "ten", "", "4294967296", "1 2"] {
    let line = format!("KB-204,OUT, {bad} ");
    assert!(
        parse_movement(&line) == Err(ParseError::InvalidQuantity(bad.to_string())),
        "a quantity must be a whole number from 1 to u32::MAX, and the error carries the trimmed field"
    );
}

// Left to right.
assert!(
    parse_movement("x,sideways,0") == Err(ParseError::InvalidSku("x".to_string())),
    "when several fields are invalid, the leftmost one is reported"
);
assert!(
    parse_movement("KB-204,sideways,0") == Err(ParseError::UnknownKind("sideways".to_string())),
    "when KIND and QUANTITY are both invalid, KIND is reported"
);
