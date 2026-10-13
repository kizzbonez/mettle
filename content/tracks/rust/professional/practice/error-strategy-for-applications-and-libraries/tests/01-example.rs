// The example from the instructions.

// An export that imports cleanly.
assert_eq!(
    import_total("rent;120000\ncoffee;450").ok(),
    Some(120_450),
    "the total of an export with two good lines"
);

// The third line has a letter in its amount. The second line is blank.
let error = import_total("rent;120000\n\ncoffee;4x0\n")
    .expect_err("an export with a bad amount cannot be imported");
assert_eq!(error.line(), 3, "the number of the line that failed, with the blank line counted");

assert_eq!(
    report(&error),
    "error: cannot import line 3\n  caused by: amount is not a whole number of cents\n  caused by: invalid digit found in string",
    "the report of the failed import: the context, the line error and the parse error behind it"
);

// A line with no amount at all has a shorter chain.
let error = import_total("rent").expect_err("an export with a missing field cannot be imported");
assert_eq!(
    report(&error),
    "error: cannot import line 1\n  caused by: missing amount field",
    "the report of an import that failed on a missing field"
);
