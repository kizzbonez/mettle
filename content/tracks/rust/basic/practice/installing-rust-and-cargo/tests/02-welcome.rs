let printed = printed_by(welcome);

assert!(
    printed.lines().count() == 1 && printed.ends_with('\n'),
    "welcome prints exactly one line and ends it"
);
assert!(
    printed == "Welcome to the Roxy!\n",
    "the text of the welcome line, with its capital letters and the exclamation mark, and no extra spaces"
);
