fn movement(sku: &str, kind: Kind, quantity: u32) -> Movement {
    Movement { sku: sku.to_string(), kind, quantity }
}

// Uploads with nothing to import.
assert!(
    parse_ledger("") == Ok(vec![]),
    "an empty upload is valid and has no movements"
);
assert!(
    parse_ledger("\n   \n# shift canceled\n\t  # no pallets, no trucks\n") == Ok(vec![]),
    "an upload of blank lines and comments is valid, including indented comments that contain commas"
);

// The first bad line wins, and skipped lines still count.
let text = "# dock 3\n\nKB-204,IN,5\n   \n# recount\nKB-204,OUT,five\nNOT A LINE\n";
assert!(
    parse_ledger(text)
        == Err(LineError { line: 6, error: ParseError::InvalidQuantity("five".to_string()) }),
    "the first failing line is reported with its 1-based number, counting blank and comment lines"
);
assert!(
    parse_ledger("KB-204\nKB-204,IN,5\n")
        == Err(LineError { line: 1, error: ParseError::WrongFieldCount(1) }),
    "an error on the very first line is reported as line 1"
);

// '#' starts a comment only at the start of a line.
assert!(
    parse_ledger("KB-204,IN,5 # recounted\n")
        == Err(LineError { line: 1, error: ParseError::InvalidQuantity("5 # recounted".to_string()) }),
    "a '#' in the middle of a line does not start a comment"
);

// Line endings and a missing final newline.
assert!(
    parse_ledger("KB-204,IN,5\r\n\r\nCBL-9,OUT,2")
        == Ok(vec![movement("KB-204", Kind::Inbound, 5), movement("CBL-9", Kind::Outbound, 2)]),
    "Windows line endings and a missing final newline are handled"
);

// Net quantity.
let movements = vec![
    movement("KB-204", Kind::Inbound, 5),
    movement("KB-20", Kind::Inbound, 100),
    movement("KB-204", Kind::Outbound, 9),
    movement("BULK-1", Kind::Inbound, u32::MAX),
    movement("BULK-1", Kind::Inbound, u32::MAX),
];
assert!(
    net_quantity(&movements, "KB-204") == -4,
    "net quantity is negative when more went out than came in"
);
assert!(
    net_quantity(&movements, "KB-20") == 100,
    "only movements whose SKU matches exactly are counted, not SKUs that merely start the same way"
);
assert!(
    net_quantity(&movements, "NOPE-1") == 0,
    "a SKU that never appears has a net quantity of 0"
);
assert!(
    net_quantity(&[], "KB-204") == 0,
    "an empty list of movements has a net quantity of 0"
);
assert!(
    net_quantity(&movements, "BULK-1") == 2 * i64::from(u32::MAX),
    "totals larger than u32::MAX are added without overflow"
);
