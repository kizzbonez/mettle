fn watering(plant: &str, milliliters: u32) -> Watering {
    Watering { plant: plant.to_string(), milliliters }
}

// Valid lines at the edges of the rules.
assert!(
    parse_watering("mint=1") == Ok(watering("mint", 1)),
    "a line without spaces is valid, and 1 is the smallest amount"
);
assert!(
    parse_watering("  lemon tree \t=  4294967295  ") == Ok(watering("lemon tree", u32::MAX)),
    "whitespace around both parts is trimmed, a plant may be two words, and the largest u32 is valid"
);

// No equals sign.
assert!(
    parse_watering("basil 250") == Err(LogError::MissingEquals),
    "a line without an equals sign has nothing to split at"
);
assert!(
    parse_watering("") == Err(LogError::MissingEquals),
    "an empty line, parsed on its own, has no equals sign either"
);
assert!(
    parse_watering("basil: 250") == Err(LogError::MissingEquals),
    "only an equals sign separates the plant from the amount"
);

// Empty plant.
assert!(
    parse_watering("= 250") == Err(LogError::EmptyPlant),
    "nothing in front of the equals sign is an empty plant"
);
assert!(
    parse_watering("   \t = 250") == Err(LogError::EmptyPlant),
    "only whitespace in front of the equals sign is an empty plant, because the plant is trimmed first"
);

// Bad amount: the error carries the trimmed text.
for bad in ["0", "-5", "2.5", "a lot", "", "250 ml", "4294967296"] {
    let line = format!("basil =  {bad} ");
    assert!(
        parse_watering(&line) == Err(LogError::BadAmount(bad.to_string())),
        "an amount must be a whole number from 1 to u32::MAX, and the error carries the trimmed text"
    );
}
assert!(
    parse_watering("basil = 2 = 3") == Err(LogError::BadAmount("2 = 3".to_string())),
    "the line is split at its first equals sign, so a second one belongs to the amount"
);

// Order of the checks.
assert!(
    parse_watering("no separator, no number") == Err(LogError::MissingEquals),
    "the equals sign is checked before anything else"
);
assert!(
    parse_watering(" = none") == Err(LogError::EmptyPlant),
    "when the plant and the amount are both wrong, the plant is reported"
);
