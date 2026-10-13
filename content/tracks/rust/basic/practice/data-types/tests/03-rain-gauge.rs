assert!(add_rain(0, 0) == 0, "an empty gauge with no rain stays empty");
assert!(add_rain(10, 20) == 30, "a sum that fits is the plain sum");
assert!(add_rain(200, 55) == 255, "a sum of exactly the limit is still the plain sum");
assert!(add_rain(255, 1) == 255, "a full gauge stays at the limit instead of wrapping around");
assert!(add_rain(1, 255) == 255, "the limit holds whichever of the two numbers is the large one");
assert!(add_rain(255, 255) == 255, "the largest possible sum stops at the limit");
assert!(add_rain(250, 10) == 255, "a sum just past the limit stops at the limit, without a panic");
