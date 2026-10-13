let printed = printed_by(|| first_pickup(Bag::Empty(250), Bag::Empty(900)));
let lines: Vec<&str> = printed.lines().collect();
assert!(lines.len() == 4, "first_pickup makes exactly four lines appear");
assert!(lines[0] == "stored 1150 g", "the first line gives the weight of both bags together");
assert!(
    lines[1] == "locker 1 is free",
    "locker 1 is given back straight after the weight is printed, before the line one left"
);
assert!(lines[2] == "one left", "the third line is one left");
assert!(lines[3] == "locker 2 is free", "locker 2 is given back last, when the function ends");

let printed = printed_by(|| {
    first_pickup(pack(100, pack(20, Bag::Empty(3))), pack(4000, Bag::Empty(500)));
});
assert!(
    printed == "stored 4623 g\nlocker 1 is free\none left\nlocker 2 is free\n",
    "bags with more bags inside them are weighed in full, and the order of the four lines stays the same"
);

let printed = printed_by(|| {
    first_pickup(Bag::Empty(0), Bag::Empty(0));
    println!("closed");
});
assert!(
    printed == "stored 0 g\nlocker 1 is free\none left\nlocker 2 is free\nclosed\n",
    "both lockers are free by the time first_pickup returns, even for bags that weigh nothing"
);
