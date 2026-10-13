let printed = printed_by(solution::main);

assert!(
    printed != "3 baskets hold 43 apples\n",
    "the program no longer prints the starter's line, because the list has changed"
);
assert!(
    printed.ends_with('\n') && printed.lines().count() == 1,
    "the program prints exactly one line, ended by println!"
);

let words: Vec<&str> = printed.split(' ').collect();
assert!(words.len() == 5, "the line still has five words, each separated by one space");
assert!(
    words[1] == "baskets" && words[2] == "hold" && words[4] == "apples\n",
    "the words of the line are the ones the starter had, with nothing added"
);
assert!(
    words[0].parse::<u32>().is_ok() && words[3].parse::<u32>().is_ok(),
    "the first and the fourth word of the line are whole numbers"
);
