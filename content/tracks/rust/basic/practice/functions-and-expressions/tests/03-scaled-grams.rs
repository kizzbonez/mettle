assert!(scaled_grams(300, 4, 4) == 300, "the same number of servings leaves the amount unchanged");
assert!(
    scaled_grams(50, 4, 2) == 25,
    "the multiplication comes before the division, so an amount that the old servings do not divide evenly still scales exactly"
);
assert!(
    scaled_grams(125, 4, 6) == 187,
    "the multiplication comes before the division, so the fraction is dropped only once, at the end"
);
assert!(scaled_grams(250, 5, 2) == 100, "fewer servings need less");
assert!(scaled_grams(10, 1, 12) == 120, "scaling up from a single serving");
assert!(scaled_grams(0, 2, 5) == 0, "nothing scaled is still nothing");
assert!(
    scaled_grams(100, 3, 1) == 33,
    "the fraction of the result is dropped, not rounded"
);
assert!(
    scaled_grams(200, 3, 2) == 133,
    "a result of 133.33 is dropped to the whole gram below it"
);
