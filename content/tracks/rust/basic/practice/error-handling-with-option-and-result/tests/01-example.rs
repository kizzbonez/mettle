// Each line calls one of your functions and compares the result with the
// example in the instructions.
assert_eq!(parse_age(" 42 "), Ok(42), "an age of 42 with spaces around it");
assert_eq!(parse_age(""), Err(AgeError::Missing), "an age that was not typed at all");
assert_eq!(
    parse_age("forty"),
    Err(AgeError::NotANumber("forty".to_string())),
    "an age written as a word"
);
assert_eq!(parse_age("16"), Err(AgeError::TooYoung(16)), "the age of a 16-year-old");

assert_eq!(entry_fee("61"), Ok(2000), "the fee for a 61-year-old");
assert_eq!(entry_fee("16"), Err(AgeError::TooYoung(16)), "the fee for a 16-year-old");

assert_eq!(finish_minutes("3:45"), Some(225), "3 hours and 45 minutes, in minutes");
assert_eq!(finish_minutes("3h45"), None, "a time that is written without a colon");
