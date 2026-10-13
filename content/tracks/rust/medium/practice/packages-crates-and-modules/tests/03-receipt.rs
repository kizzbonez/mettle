use solution::counter::Parcel;

assert!(
    desk::receipt(&Parcel::new("card", 20)) == "card: 20 g, 350 cents",
    "the receipt is the label, a colon, the weight with g, a comma, and the postage with cents"
);
assert!(
    desk::receipt(&Parcel::new("tea set", 760)) == "tea set: 760 g, 590 cents",
    "a label of two words is printed whole"
);
assert!(
    desk::receipt(&Parcel::new("lamp", 2001)) == "lamp: 2001 g, 990 cents",
    "the postage on the receipt is the one counter::rates::postage gives for band 3"
);
assert!(
    desk::receipt(&Parcel::new("mug", 500)) == "mug: 500 g, 350 cents",
    "the postage on the receipt follows the band limits"
);

// `label` is a public field, so the clerk can correct it. The weight stays.
let mut parcel = Parcel::new("boks", 1200);
parcel.label = String::from("books");
assert!(
    desk::receipt(&parcel) == "books: 1200 g, 590 cents",
    "the receipt shows the label the parcel has now, with the weight it was given"
);
