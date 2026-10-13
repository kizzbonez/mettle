let rental = Rental::new("Grace Hopper", 7);
assert!(
    format!("{rental:?}") == "Rental { rider: \"Grace Hopper\", hours: 7 }",
    "the struct has exactly the fields rider and hours, in that order, and new stores what it was given"
);

// derive(PartialEq) compares every field.
assert!(
    Rental::new("Lin", 4) == Rental::new("Lin", 4),
    "two rentals built from the same rider and hours are equal"
);
assert!(
    Rental::new("Lin", 4) != Rental::new("Lin", 5),
    "rentals with different hours are not equal, so new stores the hours"
);
assert!(
    Rental::new("Lin", 4) != Rental::new("Lyn", 4),
    "rentals with different riders are not equal, so new stores the rider"
);

assert!(Rental::new("Lin", 0).price_cents() == 300, "a rental of 0 hours costs only the unlock fee");
assert!(
    Rental::new("Lin", 1).price_cents() == 750,
    "one hour costs the unlock fee once plus the hourly rate once"
);
assert!(
    Rental::new("Lin", 10).price_cents() == 4800,
    "the unlock fee is charged once, however many hours there are"
);

// price_cents only borrows the rental, so it can be asked twice.
let rental = Rental::new("Sam", 3);
assert!(
    rental.price_cents() == 1650 && rental.price_cents() == 1650,
    "reading the price does not change the rental"
);
