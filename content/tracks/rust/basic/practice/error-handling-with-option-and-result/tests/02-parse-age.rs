// Valid ages at the edges of the rules.
assert!(parse_age("18") == Ok(18), "18 is the youngest age that is accepted");
assert!(parse_age("255") == Ok(255), "the largest number a u8 can hold is still an age");
assert!(
    parse_age("\t 30 \n") == Ok(30),
    "whitespace of any kind around the number is trimmed before parsing"
);

// Missing.
assert!(parse_age("") == Err(AgeError::Missing), "an empty text is a missing age");
assert!(
    parse_age("   ") == Err(AgeError::Missing),
    "a text of spaces only is a missing age, because the text is trimmed before it is checked"
);

// Not a number: the error carries the trimmed text.
for bad in ["forty", "-3", "12.5", "256", "1 8", "18 years"] {
    let typed = format!("  {bad} ");
    assert!(
        parse_age(&typed) == Err(AgeError::NotANumber(bad.to_string())),
        "a text that does not parse as a u8 is not a number, and the error carries it without the surrounding whitespace"
    );
}

// Too young: the error carries the age.
assert!(parse_age("17") == Err(AgeError::TooYoung(17)), "17 is the oldest age that is too young");
assert!(parse_age("0") == Err(AgeError::TooYoung(0)), "an age of 0 is a number, and it is too young");
assert!(
    parse_age(" 5 ") == Err(AgeError::TooYoung(5)),
    "the error for a young runner carries the age as a number"
);
