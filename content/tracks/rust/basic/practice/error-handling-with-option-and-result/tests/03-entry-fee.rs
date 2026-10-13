// The two fees and the boundary between them.
assert!(entry_fee("18") == Ok(3500), "the youngest runner pays the standard fee");
assert!(entry_fee("59") == Ok(3500), "59 is the last age that pays the standard fee");
assert!(entry_fee("60") == Ok(2000), "60 is the first age that pays the reduced fee");
assert!(entry_fee("99") == Ok(2000), "an older runner pays the reduced fee");
assert!(
    entry_fee("  45\n") == Ok(3500),
    "the age is read by parse_age, so whitespace around it does not matter"
);

// Every error of parse_age reaches the caller unchanged.
assert!(entry_fee("") == Err(AgeError::Missing), "a missing age is passed on as it is");
assert!(
    entry_fee(" x9 ") == Err(AgeError::NotANumber("x9".to_string())),
    "a text that is not a number is passed on with the trimmed text inside"
);
assert!(
    entry_fee("12") == Err(AgeError::TooYoung(12)),
    "a runner who is too young is passed on with the age inside"
);
assert!(
    entry_fee("300") == Err(AgeError::NotANumber("300".to_string())),
    "a number too large for a u8 is passed on as not a number"
);
