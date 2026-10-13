assert!(
    Rental::new("Lin", 1).into_receipt() == "Lin: 1 h, 750 cents",
    "the receipt is the rider, a colon, the hours with h, a comma, and the price with cents"
);
assert!(
    Rental::new("Lin", 0).into_receipt() == "Lin: 0 h, 300 cents",
    "a rental of 0 hours still gets a receipt, with the unlock fee as its price"
);
assert!(
    Rental::new("Grace Hopper", 12).into_receipt() == "Grace Hopper: 12 h, 5700 cents",
    "a rider's name of two words is printed whole, and the price on the receipt is the one price_cents gives"
);

let mut rental = Rental::new("Sam", 2);
rental.extend(2);
assert!(
    rental.into_receipt() == "Sam: 4 h, 2100 cents",
    "the receipt shows the hours and the price after an extension"
);
