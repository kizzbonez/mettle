let printed = printed_by(solution::main);

let first_word = printed.split_whitespace().next().unwrap_or("");
assert!(
    first_word == "4",
    "the number of baskets at the start of the line, which the program takes from the list"
);
