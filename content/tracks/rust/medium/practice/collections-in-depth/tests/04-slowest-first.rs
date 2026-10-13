assert!(slowest_first(&[]).is_empty(), "no repairs give an empty list");
assert!(slowest_first(&[("zip", 12)]) == [("zip", 12)], "a single repair is returned as it is");

assert!(
    slowest_first(&[("zip", 12), ("bike", 40), ("radio", 35)]) == [("bike", 40), ("radio", 35), ("zip", 12)],
    "repairs with different minutes are sorted from the longest to the shortest"
);
assert!(
    slowest_first(&[("bike", 40), ("radio", 35), ("zip", 12)]) == [("bike", 40), ("radio", 35), ("zip", 12)],
    "repairs that are already in order stay in order"
);
assert!(
    slowest_first(&[("zip", 5), ("radio", 50), ("bike", 500)]) == [("bike", 500), ("radio", 50), ("zip", 5)],
    "the minutes are compared as numbers"
);

// Ties keep the order of the input, which is not alphabetical here.
assert!(
    slowest_first(&[("walker", 30), ("mixer", 30), ("amp", 30)]) == [("walker", 30), ("mixer", 30), ("amp", 30)],
    "repairs that all took equally long stay in the order of the input"
);
assert!(
    slowest_first(&[("toaster", 10), ("drill", 60), ("iron", 10), ("clock", 60), ("blender", 10)])
        == [("drill", 60), ("clock", 60), ("toaster", 10), ("iron", 10), ("blender", 10)],
    "within each group of equally long repairs the order of the input is kept"
);

// Every pair is kept, repeated ones included.
let repairs = [("lamp", 20), ("lamp", 20), ("lamp", 45)];
let sorted = slowest_first(&repairs);
assert!(sorted == [("lamp", 45), ("lamp", 20), ("lamp", 20)], "repairs with the same kind and minutes are all kept");
assert!(repairs == [("lamp", 20), ("lamp", 20), ("lamp", 45)], "the input is left as it was");
