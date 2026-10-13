assert!(
    prepare("MAD", false) == "To: MAD",
    "a suitcase that is not fragile gets the plain tag, without a mark"
);
assert!(
    prepare("MAD", true) == "To: MAD [fragile]",
    "a fragile suitcase gets the tag with the fragile mark at the end"
);
assert!(
    prepare("New York", true) == "To: New York [fragile]",
    "the mark comes after the whole destination"
);
assert!(prepare("", false) == "To: ", "an empty destination without a mark");
assert!(prepare("", true) == "To:  [fragile]", "an empty destination with a mark");

// prepare gives the same results as the two functions it is built from.
assert!(
    prepare("CPH", false) == new_tag("CPH"),
    "without the mark, prepare returns what new_tag returns"
);
assert!(
    prepare("CPH", true) == mark_fragile(new_tag("CPH")),
    "with the mark, prepare returns what mark_fragile makes of the new tag"
);
