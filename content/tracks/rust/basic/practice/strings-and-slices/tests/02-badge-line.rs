assert!(
    badge_line("Grace Hopper", "Navy") == "GRACE HOPPER, Navy",
    "tidy input: the name in upper case, a comma, one space, then the company"
);
assert!(
    badge_line("\tlin\n", "\n  Open Source Guild\t") == "LIN, Open Source Guild",
    "tabs and line endings at either end are whitespace too, and are trimmed from both texts"
);
assert!(
    badge_line(" mary  ann ", "x") == "MARY  ANN, x",
    "only the ends are trimmed: spaces inside the name stay as they are"
);
assert!(
    badge_line("ada", "rust Foundation LTD") == "ADA, rust Foundation LTD",
    "the company keeps its own upper and lower case"
);
assert!(
    badge_line("zoë", "Café Noir") == "ZOË, Café Noir",
    "letters outside ASCII are put in upper case as well"
);
assert!(
    badge_line("", "") == ", ",
    "empty texts still give the comma and the space between them"
);
