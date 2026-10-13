use std::error::Error;
use std::num::ParseIntError;

// Display: the message for people.
assert!(
    LineError::MissingField("amount").to_string() == "missing amount field",
    "the message of a missing field names the field"
);
assert!(
    LineError::MissingField("label").to_string() == "missing label field",
    "the message of a missing field uses the name the variant carries"
);

let cause: ParseIntError = "4x0".parse::<u32>().expect_err("4x0 is not a number");
let cause_text = cause.to_string();
let bad = LineError::BadAmount(cause);
assert!(
    !bad.to_string().contains(&cause_text),
    "the message of a bad amount does not repeat its cause, which a reporter prints from source"
);
assert!(
    bad.to_string() == "amount is not a whole number of cents",
    "the message of a bad amount says what is wrong with the line"
);

// source: the cause for code and for reporters.
assert!(
    LineError::MissingField("label").source().is_none(),
    "a missing field has no cause behind it"
);
let source = bad.source();
assert!(source.is_some(), "a bad amount exposes its cause through source");
let inner = source.and_then(|cause| cause.downcast_ref::<ParseIntError>());
assert!(inner.is_some(), "the cause of a bad amount is the ParseIntError the variant carries");
assert!(
    inner.map(|cause| cause.to_string()) == Some(cause_text),
    "the cause is the original parse error with its own message"
);

// From: what `?` calls on the way out of parse_line.
let empty: ParseIntError = "".parse::<u32>().expect_err("an empty text is not a number");
let empty_text = empty.to_string();
let converted: LineError = empty.into();
assert!(
    matches!(converted, LineError::BadAmount(_)),
    "a ParseIntError converts into the bad amount variant"
);
assert!(
    converted.source().map(|cause| cause.to_string()) == Some(empty_text),
    "the conversion keeps the ParseIntError it was given as the cause"
);

let parsed = parse_line("coffee;4x0");
assert!(
    matches!(parsed, Err(LineError::BadAmount(_))),
    "parse_line turns a bad amount into a line error through the question mark"
);
let too_large = parse_line("house;99999999999");
assert!(
    matches!(too_large, Err(LineError::BadAmount(_))),
    "an amount too large for a u32 is a bad amount as well"
);
assert!(
    matches!(parse_line("coffee"), Err(LineError::MissingField("amount"))),
    "a line without a semicolon has no amount field"
);
assert!(
    matches!(parse_line(" rent ; 120000 "), Ok((label, 120_000)) if label == "rent"),
    "a good line still parses"
);

// A typed error can travel as an application's opaque error.
let boxed: Box<dyn Error + Send + Sync + 'static> = Box::new(LineError::MissingField("label"));
assert!(
    boxed.to_string() == "missing label field",
    "a boxed line error keeps its message"
);
assert!(
    boxed.downcast_ref::<LineError>().is_some(),
    "a boxed line error can be downcast back to the typed error"
);
