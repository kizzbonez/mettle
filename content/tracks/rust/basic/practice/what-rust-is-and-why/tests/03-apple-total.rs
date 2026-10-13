let printed = printed_by(solution::main);

// The total is the fourth word of "N baskets hold T apples".
let total = printed.split_whitespace().nth(3).unwrap_or("");
assert!(
    total == "50",
    "the total in the line: the three old baskets plus the 7 apples of the new one"
);
