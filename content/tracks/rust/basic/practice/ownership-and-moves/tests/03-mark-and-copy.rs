assert!(
    mark_fragile(String::from("To: MAD")) == "To: MAD [fragile]",
    "the mark is one space and the word fragile in square brackets, added at the end"
);
assert!(
    mark_fragile(String::from("")) == " [fragile]",
    "the mark is appended to whatever text the tag holds, even none"
);
let twice = mark_fragile(mark_fragile(String::from("To: CPH")));
assert!(
    twice == "To: CPH [fragile] [fragile]",
    "a tag that is handed in a second time gets the mark a second time"
);

let (original, copy) = copy_tag(String::from("To: HEL [fragile]"));
assert!(
    original == "To: HEL [fragile]" && copy == "To: HEL [fragile]",
    "both tags that copy_tag returns hold the full text it was given"
);
let (original, copy) = copy_tag(String::from(""));
assert!(original == "" && copy == "", "an empty tag is copied as an empty tag");

// The two tags are separate values: marking one leaves the other alone.
let (original, copy) = copy_tag(String::from("To: RIX"));
let marked = mark_fragile(copy);
assert!(
    original == "To: RIX" && marked == "To: RIX [fragile]",
    "changing the copy does not change the original"
);
