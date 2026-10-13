assert!(busy_lanes([0, 0, 0, 0, 0, 0]) == 0, "an empty pool has no busy lane");
assert!(
    busy_lanes([4, 4, 4, 4, 4, 4]) == 0,
    "a lane with exactly 4 swimmers is not busy yet"
);
assert!(busy_lanes([5, 5, 5, 5, 5, 5]) == 6, "all six lanes can be busy at once");
assert!(
    busy_lanes([9, 0, 0, 0, 0, 5]) == 2,
    "the first and the last lane are counted like the ones in between"
);
assert!(
    busy_lanes([30, 1, 2, 3, 4, 1]) == 1,
    "the result is the number of busy lanes, not the number of swimmers in them"
);

assert!(pyramid_lengths(0) == 0, "a pyramid with a top of 0 has no lengths");
assert!(pyramid_lengths(1) == 1, "a pyramid with a top of 1 is a single length");
assert!(pyramid_lengths(2) == 3, "the top step itself is part of the sum");
assert!(pyramid_lengths(100) == 5050, "a tall pyramid adds every step from 1 to the top");
