let mut rental = Rental::new("Sam", 1);
rental.extend(2);
assert!(
    rental == Rental::new("Sam", 3),
    "extending adds the extra hours to the hours the rental already has"
);

rental.extend(0);
assert!(rental == Rental::new("Sam", 3), "extending by 0 hours changes nothing");

rental.extend(1);
rental.extend(4);
assert!(rental == Rental::new("Sam", 8), "every extension adds to the ones before it");
assert!(rental.price_cents() == 3900, "the price follows the extended hours");

// A clone made earlier is a separate rental.
let mut first = Rental::new("Noor", 2);
let before = first.clone();
first.extend(5);
assert!(
    before == Rental::new("Noor", 2) && first == Rental::new("Noor", 7),
    "extending one rental changes neither its rider nor a clone that was made before"
);
