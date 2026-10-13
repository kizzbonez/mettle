assert!(ticket_kind("STU-0001") == "STU", "the kind of a student ticket");
assert!(ticket_kind("SPK-9") == "SPK", "the kind does not depend on how long the number is");
assert!(
    ticket_kind("VIP-7") == "VIP",
    "the kind is exactly the three letters, without the dash that follows them"
);

// The result is a slice of the code itself, not new text.
let code = String::from("DAY-0310");
let kind = ticket_kind(&code);
assert!(
    kind == "DAY" && std::ptr::eq(kind.as_ptr(), code.as_ptr()),
    "the kind is a slice that points into the code it was given"
);

assert!(count_sessions("rust") == 1, "a list with a single session");
assert!(count_sessions("rust,wasm,testing") == 3, "sessions separated by commas without spaces");
assert!(
    count_sessions(" rust , wasm , testing ") == 3,
    "spaces around the entries do not change the count"
);
assert!(count_sessions("") == 0, "an empty list has no sessions");
assert!(count_sessions("   ") == 0, "a list of spaces only has no sessions");
assert!(
    count_sessions("rust,,wasm, ,") == 2,
    "entries that are empty after trimming do not count, wherever they are in the list"
);
assert!(count_sessions(",") == 0, "a lone comma separates two empty entries");
assert!(
    count_sessions("intro to rust, error handling") == 2,
    "a session name of several words is one entry"
);
