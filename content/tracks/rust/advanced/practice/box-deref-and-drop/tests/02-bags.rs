// A bag with nothing in it.
assert!(total_weight(&Bag::Empty(0)) == 0, "an empty bag that weighs nothing");
assert!(total_weight(&Bag::Empty(350)) == 350, "a bag with nothing in it weighs what it weighs itself");

// pack builds the recursive value.
assert!(
    pack(120, Bag::Empty(30)) == Bag::Packed(120, Box::new(Bag::Empty(30))),
    "pack returns a Bag::Packed with the new weight first and the inner bag in a Box"
);
let inner = pack(5, Bag::Empty(7));
assert!(
    pack(11, inner) == Bag::Packed(11, Box::new(Bag::Packed(5, Box::new(Bag::Empty(7))))),
    "packing a bag that already holds a bag keeps everything that was inside it"
);

// total_weight follows the packing to the bottom.
assert!(total_weight(&pack(120, Bag::Empty(30))) == 150, "the weight of one bag inside another");
let by_hand = Bag::Packed(10, Box::new(Bag::Packed(20, Box::new(Bag::Packed(30, Box::new(Bag::Empty(40)))))));
assert!(
    total_weight(&by_hand) == 100,
    "four bags inside each other, built without pack: every layer is counted"
);

let mut deep = Bag::Empty(1);
for weight in 2..=200 {
    deep = pack(weight, deep);
}
assert!(total_weight(&deep) == 20_100, "200 bags inside each other: every layer is counted once");

// total_weight only borrows, so the bag can be weighed again.
let bag = pack(1, pack(0, Bag::Empty(2)));
assert!(
    total_weight(&bag) == 3 && total_weight(&bag) == 3,
    "weighing a bag twice gives the same answer, and a layer that weighs nothing changes nothing"
);
