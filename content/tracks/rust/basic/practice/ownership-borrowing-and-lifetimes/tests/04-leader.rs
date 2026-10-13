let hawks = String::from("Hawks");
let wrens = String::from("Wrens");

assert!(
    leader(&hawks, 30, &wrens, 10) == "Hawks",
    "the first team leads when it has more points"
);
assert!(
    leader(&hawks, 10, &wrens, 30) == "Wrens",
    "the second team leads when it has more points"
);
assert!(
    leader(&hawks, 11, &wrens, 12) == "Wrens",
    "a single point is enough to lead"
);
assert!(leader(&hawks, 25, &wrens, 25) == "Hawks", "a tie goes to the first team");
assert!(leader(&hawks, 0, &wrens, 0) == "Hawks", "a tie at zero points also goes to the first team");

// The result is one of the two references that were passed in, not a new String.
assert!(
    std::ptr::eq(leader(&hawks, 30, &wrens, 10), &hawks),
    "the result refers to the very String that was passed as the first name"
);
assert!(
    std::ptr::eq(leader(&hawks, 10, &wrens, 30), &wrens),
    "the result refers to the very String that was passed as the second name"
);

// Two teams may share a name: the reference still has to be the right one.
let twin = String::from("Hawks");
assert!(
    std::ptr::eq(leader(&hawks, 1, &twin, 2), &twin),
    "with two equal names the result is still the reference of the team with more points"
);
