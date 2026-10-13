use std::borrow::Borrow;
use std::collections::HashSet;

for valid in ["PX004217", "PX000000", "PX999999"] {
    let code = TrackingCode::parse(valid);
    assert!(code.is_some(), "PX followed by six digits is a tracking code");
    assert!(
        code.expect("checked on the line above").as_str() == valid,
        "as_str gives back the text the code was parsed from"
    );
}

let refused = [
    ("", "an empty text is refused"),
    ("PX", "the prefix without digits is refused"),
    ("PX00421", "five digits are refused"),
    ("PX0042170", "seven digits are refused"),
    ("px004217", "a prefix in lower case is refused"),
    ("XP004217", "another prefix is refused"),
    ("004217PX", "the letters after the digits are refused"),
    ("PX00421A", "a letter among the digits is refused"),
    ("PX-04217", "a sign among the digits is refused"),
    ("PX 04217", "a space among the digits is refused"),
    (" PX004217", "a space before the code is refused: the text is not trimmed"),
    ("PX004217 ", "a space after the code is refused: the text is not trimmed"),
    ("PXPX004217", "the prefix twice is refused"),
    ("PX00\u{663}217", "a digit outside ASCII among the six is refused"),
    ("PX\u{661}\u{662}\u{663}", "three digits outside ASCII, which take six bytes, are refused"),
];
for (text, why) in refused {
    assert!(TrackingCode::parse(text).is_none(), "{why}");
}

// The borrowed form of a code is its text.
let code = TrackingCode::parse("PX123456").expect("a valid tracking code");
let other = TrackingCode::parse("PX123457").expect("a valid tracking code");
let borrowed: &str = code.borrow();
assert!(
    borrowed == "PX123456" && borrowed == code.as_str(),
    "borrowing a code as a str gives the same text as as_str"
);
assert!(code == code.clone() && code != other, "codes compare by their text");

// `Borrow` promises that the borrowed form hashes and compares like the owned
// one. A hash set relies on that promise.
let mut seen = HashSet::new();
seen.insert(code.clone());
assert!(seen.contains("PX123456"), "a set of codes can be searched with the &str of a code in it");
assert!(seen.contains(&code), "a set of codes can be searched with a code");
assert!(!seen.contains("PX123457"), "the &str of a code that is not in the set is not found");
assert!(!seen.contains(&other), "a code that is not in the set is not found");
