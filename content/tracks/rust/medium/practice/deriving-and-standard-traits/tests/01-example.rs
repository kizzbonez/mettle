// The example from the instructions.
assert_eq!(Size::default(), Size::Regular, "the default size");
assert_eq!(Size::Large.to_string(), "large", "the large size as the customer reads it");

let mint = Cone::from("mint");
assert_eq!(
    format!("{mint:?}"),
    "Cone { size: Regular, flavour: \"mint\" }",
    "the debug form of a cone made from the flavour mint, which lists the fields in the order they are declared"
);
assert_eq!(format!("{mint}"), "regular cone, mint", "the same cone as the customer reads it");

// A struct literal names its fields, so it does not depend on their order.
let large = Cone { size: Size::Large, flavour: String::from("apple") };
let kids = Cone { size: Size::Kids, flavour: String::from("vanilla") };
assert_eq!(
    smaller(large, kids.clone()),
    kids,
    "the smaller of a large apple cone and a kids vanilla cone"
);
