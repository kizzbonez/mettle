// Each line calls one of your functions and compares the result with the
// example in the instructions.
assert_eq!(entry_price(4), 0, "the price for a 4-year-old");
assert_eq!(entry_price(10), 300, "the price for a 10-year-old");
assert_eq!(entry_price(30), 600, "the price for a 30-year-old");
assert_eq!(entry_price(70), 350, "the price for a 70-year-old");

assert_eq!(
    busy_lanes([2, 5, 0, 7, 4, 9]),
    3,
    "the lanes with more than 4 swimmers among 2, 5, 0, 7, 4 and 9"
);

assert_eq!(pyramid_lengths(4), 10, "a pyramid of 1, 2, 3 and 4 lengths");

assert_eq!(
    hours_to_fill(40, 100),
    4,
    "the hours for water that is 40 cm deep to reach 100 cm at 15 cm an hour"
);
