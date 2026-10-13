assert!(letter_count("Ada") == 3, "a short name without spaces");
assert!(letter_count("") == 0, "an empty name has no characters");
assert!(letter_count("   ") == 0, "a name of spaces only has nothing to count");
assert!(
    letter_count(" a b ") == 2,
    "spaces at the ends and in the middle are all left out"
);
assert!(
    letter_count("Zoë") == 3,
    "a letter that takes two bytes in UTF-8 is still one character"
);
assert!(
    letter_count("Zoë Müller") == 9,
    "characters are counted, not bytes, and the space between the names is left out"
);
assert!(
    letter_count("李 小龙") == 3,
    "characters that take three bytes each are counted once each"
);
assert!(
    letter_count("O'Neil-Smith") == 12,
    "punctuation is a character like any other and is counted"
);
