// Deref: a locker can be used like the bag inside it.
let locker = Locker::new(12, pack(300, Bag::Empty(50)));
let bag: &Bag = &locker;
assert!(
    *bag == Bag::Packed(300, Box::new(Bag::Empty(50))),
    "a locker dereferences to exactly the bag that was stored in it"
);
assert!(
    total_weight(&locker) == 350,
    "a &Locker passed to total_weight is weighed as the bag inside it"
);
assert!(*Locker::new(3, Bag::Empty(9)) == Bag::Empty(9), "the * operator on a locker gives its bag");

// Drop: one line per locker, at the moment it is dropped.
let printed = printed_by(|| {
    let _locker = Locker::new(12, Bag::Empty(50));
    println!("end of scope");
});
assert!(
    printed == "end of scope\nlocker 12 is free\n",
    "a locker prints its line when it goes out of scope, with its own number, and nothing else"
);

let printed = printed_by(|| {
    let _a = Locker::new(1, Bag::Empty(1));
    let _b = Locker::new(2, Bag::Empty(1));
    let _c = Locker::new(30, Bag::Empty(1));
});
assert!(
    printed == "locker 30 is free\nlocker 2 is free\nlocker 1 is free\n",
    "three lockers that go out of scope together each print their own number, the newest first"
);

let printed = printed_by(|| {
    let lockers = vec![Locker::new(4, Bag::Empty(1)), Locker::new(9, pack(2, Bag::Empty(1)))];
    let moved = lockers;
    println!("moved");
    drop(moved);
    println!("done");
});
assert!(
    printed == "moved\nlocker 4 is free\nlocker 9 is free\ndone\n",
    "moving lockers prints nothing, and dropping them early frees each one exactly once"
);
