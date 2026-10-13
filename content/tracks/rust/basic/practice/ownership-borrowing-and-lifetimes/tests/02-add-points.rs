let mut score = 0;
add_points(&mut score, 7);
assert!(score == 7, "points are added to a score that starts at zero");

add_points(&mut score, 0);
assert!(score == 7, "adding zero points leaves the score as it was");

add_points(&mut score, 3);
add_points(&mut score, 3);
assert!(score == 13, "every call adds to what is already there, so points pile up");

let mut other = 1_000_000;
add_points(&mut other, 2_000_000);
assert!(other == 3_000_000, "large scores are added like small ones");
assert!(score == 13, "only the score that was lent out is changed");
