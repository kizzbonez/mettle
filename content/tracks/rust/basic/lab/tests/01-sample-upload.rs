let ledger = "# dock 7, evening shift\nKB-204, IN, 40\nKB-204, OUT, 12\n\nCBL-9, IN, 300\n";

let movements = parse_ledger(ledger).expect("the sample upload is valid");
assert_eq!(
    movements,
    vec![
        Movement { sku: "KB-204".to_string(), kind: Kind::Inbound, quantity: 40 },
        Movement { sku: "KB-204".to_string(), kind: Kind::Outbound, quantity: 12 },
        Movement { sku: "CBL-9".to_string(), kind: Kind::Inbound, quantity: 300 },
    ],
    "movements parsed from the sample upload"
);

assert_eq!(net_quantity(&movements, "KB-204"), 28, "net quantity of KB-204");
assert_eq!(net_quantity(&movements, "CBL-9"), 300, "net quantity of CBL-9");

assert_eq!(
    parse_movement("KB-204, OUT, 1 2"),
    Err(ParseError::InvalidQuantity("1 2".to_string())),
    "the line that crashed the old importer"
);
