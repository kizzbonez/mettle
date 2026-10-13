// The example from the instructions. `printed_by` runs a piece of code and
// returns everything it printed, including what a `Drop` prints on the way out.
let printed = printed_by(|| {
    let locker = Locker::new(7, pack(900, pack(250, Bag::Empty(40))));
    // A `&Locker` is passed where a `&Bag` is expected: deref coercion.
    println!("{}", total_weight(&locker));
});
assert_eq!(
    printed,
    "1190\nlocker 7 is free\n",
    "the weight of a pouch in a bag in a suitcase, then the line locker 7 prints when it goes out of scope"
);

let printed = printed_by(|| first_pickup(pack(900, Bag::Empty(100)), Bag::Empty(400)));
assert_eq!(
    printed,
    "stored 1400 g\nlocker 1 is free\none left\nlocker 2 is free\n",
    "the four lines of first_pickup for a 1000 g suitcase and a 400 g bag"
);
