// The six dice that exist.
for sides in [4_u32, 6, 8, 10, 12, 20] {
    assert!(
        Die::try_from(sides).map(|die| die.sides()) == Ok(sides),
        "each of 4, 6, 8, 10, 12 and 20 makes a die with that many sides"
    );
}

// Everything else is refused, and the error carries the number.
for sides in [0_u32, 1, 2, 3, 5, 7, 9, 11, 13, 14, 16, 18, 19, 21, 24, 100, u32::MAX] {
    assert!(
        Die::try_from(sides) == Err(DieError::Sides(sides)),
        "a number that is not 4, 6, 8, 10, 12 or 20 is refused with the Sides error, which carries the number"
    );
}

// Implementing TryFrom gives the other side try_into.
let die: Result<Die, DieError> = 12_u32.try_into();
assert!(die.map(|die| die.sides()) == Ok(12), "try_into makes the same die as try_from");

// The three messages.
assert!(
    DieError::Format.to_string() == "a die is written as d and a number",
    "the message of Format, in lower case and with no full stop"
);
assert!(DieError::Sides(0).to_string() == "no die has 0 sides", "the message of Sides names the number 0");
assert!(DieError::Sides(100).to_string() == "no die has 100 sides", "the message of Sides names the number 100");

let not_a_number = "six".parse::<u32>().unwrap_err();
let expected = format!("not a number of sides: {not_a_number}");
assert!(
    DieError::Number(not_a_number).to_string() == expected,
    "the message of Number ends with the message of the error it wraps"
);
let nothing = "".parse::<u32>().unwrap_err();
let expected = format!("not a number of sides: {nothing}");
assert!(
    DieError::Number(nothing).to_string() == expected,
    "the message of Number shows the wrapped error, whichever kind of parse failure it is"
);

// Display writes into any formatter.
assert!(
    format!("error: {}", DieError::Sides(7)) == "error: no die has 7 sides",
    "a DieError can be formatted inside a longer text"
);
