fn sides_of(text: &str) -> Result<u32, DieError> {
    text.parse::<Die>().map(|die| die.sides())
}

// Good dice.
assert!(sides_of("d4") == Ok(4), "d4 is the smallest die");
assert!(sides_of("d10") == Ok(10), "a die with a number of two digits");
assert!(sides_of("d12") == Ok(12), "d12 is a die");
assert!(sides_of("d20") == Ok(20), "d20 is the largest die");

// Format: no lower-case d in front.
assert!(sides_of("6") == Err(DieError::Format), "a plain number has no d in front");
assert!(sides_of("") == Err(DieError::Format), "an empty text has no d in front");
assert!(sides_of("D6") == Err(DieError::Format), "a capital D is not the lower-case d");
assert!(sides_of("x6") == Err(DieError::Format), "another letter is not a d");
assert!(sides_of(" d6") == Err(DieError::Format), "the text is not trimmed, so a space in front is a format error");
assert!(
    sides_of("7") == Err(DieError::Format),
    "the d is checked first, so a number without it is a format error whatever the number"
);

// Number: what follows the d does not parse as a u32. The error of parse is wrapped.
assert!(
    sides_of("dx") == Err(DieError::Number("x".parse::<u32>().unwrap_err())),
    "a letter after the d is wrapped as the error that parse gave for it"
);
assert!(
    sides_of("d") == Err(DieError::Number("".parse::<u32>().unwrap_err())),
    "a d with nothing after it is wrapped as the error that parse gives for an empty text"
);
assert!(
    sides_of("d4294967296") == Err(DieError::Number("4294967296".parse::<u32>().unwrap_err())),
    "a number too large for a u32 is wrapped as the error that parse gave for it"
);
assert!(matches!(sides_of("dd6"), Err(DieError::Number(_))), "only the first d is taken off before parsing");
assert!(matches!(sides_of("d-6"), Err(DieError::Number(_))), "a negative number does not parse as a u32");
assert!(matches!(sides_of("d6 "), Err(DieError::Number(_))), "the text is not trimmed, so a space behind does not parse");

// Sides: a number, but not a die.
assert!(sides_of("d7") == Err(DieError::Sides(7)), "a number that parses is handed to try_from, which refuses 7");
assert!(sides_of("d0") == Err(DieError::Sides(0)), "a die with 0 sides is refused with the Sides error");
assert!(sides_of("d100") == Err(DieError::Sides(100)), "a die with 100 sides is refused with the Sides error");
