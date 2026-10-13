// Each line calls one of your functions and compares the result with the
// example in the instructions.
assert_eq!(total_minutes(1, 30), 90, "1 hour and 30 minutes, in minutes");
assert_eq!(scaled_grams(125, 4, 6), 187, "125 g for 4 servings, scaled to 6 servings");
assert_eq!(needs_second_tray(12), false, "whether 12 cookies need a second tray");
assert_eq!(needs_second_tray(13), true, "whether 13 cookies need a second tray");
assert_eq!(
    ready_in(1, 30, 25),
    115,
    "1 hour and 30 minutes of preparation, then 25 minutes of baking"
);
