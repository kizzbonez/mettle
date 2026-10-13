// The example from the instructions, step by step.
let mut rental = Rental::new("Ada", 2);

// `{:?}` shows the fields in the order the struct declares them.
assert_eq!(
    format!("{rental:?}"),
    "Rental { rider: \"Ada\", hours: 2 }",
    "the debug form of a new rental, which lists its two fields in order"
);

assert_eq!(rental.price_cents(), 1200, "the price of a 2-hour rental");

rental.extend(1);
assert_eq!(rental.price_cents(), 1650, "the price after the rental was extended by 1 hour");

assert_eq!(
    rental.into_receipt(),
    "Ada: 3 h, 1650 cents",
    "the receipt line of the extended rental"
);
