// The example from the instructions. Every item is reached by its path.
let parcel = counter::Parcel::new("books", 1200);

assert_eq!(parcel.label, "books", "the public field label of a new parcel");
assert_eq!(parcel.grams(), 1200, "the weight of a new parcel, read through the method grams");

assert_eq!(
    counter::rates::postage(&parcel),
    590,
    "the postage of a 1200 g parcel, reached as counter::rates::postage"
);
assert_eq!(
    postage(&parcel),
    590,
    "the postage of the same parcel, reached through the re-export at the top level"
);
assert_eq!(
    desk::receipt(&parcel),
    "books: 1200 g, 590 cents",
    "the receipt line of the 1200 g parcel labelled books"
);
