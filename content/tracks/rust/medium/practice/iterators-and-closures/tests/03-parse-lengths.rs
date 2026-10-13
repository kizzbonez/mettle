// Every text is a number.
assert!(parse_lengths(&[]) == Ok(vec![]), "no texts give an empty list of numbers");
assert!(parse_lengths(&["0"]) == Ok(vec![0]), "a single 0 is a number");
assert!(
    parse_lengths(&["372", "45", "45", "4294967295"]) == Ok(vec![372, 45, 45, 4294967295]),
    "the numbers come back in the order of the texts, up to the largest u32"
);

// One text is not a number: the whole result is that error.
let word = "three".parse::<u32>().unwrap_err();
let empty = "".parse::<u32>().unwrap_err();
let too_large = "4294967296".parse::<u32>().unwrap_err();

assert!(parse_lengths(&["three"]) == Err(word.clone()), "a single word gives the error of parsing that word");
assert!(
    parse_lengths(&["45", "215", "three"]) == Err(word.clone()),
    "one bad text at the end turns the whole result into its error"
);
assert!(
    parse_lengths(&["45", "4294967296"]) == Err(too_large.clone()),
    "a number too large for a u32 is an error, and it is the error parse gives for it"
);
assert!(
    parse_lengths(&["12", "", "three"]) == Err(empty.clone()),
    "with two bad texts the error is the one of the first"
);
assert!(
    parse_lengths(&["three", "", "7"]) == Err(word.clone()),
    "with two bad texts the error is the one of the first, whichever kind it is"
);

// The texts are parsed as they are.
assert!(
    parse_lengths(&["45", " 215"]).is_err(),
    "a text with a space in front is not trimmed, so it does not parse"
);
assert!(parse_lengths(&["-5"]).is_err(), "a negative number does not parse as a u32");
assert!(parse_lengths(&["3.5"]).is_err(), "a number with a decimal point does not parse as a u32");
