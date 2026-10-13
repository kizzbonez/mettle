use std::error::Error;
use std::num::ParseIntError;

// Exports that import cleanly.
assert!(import_total("").ok() == Some(0), "an empty export has a total of 0");
assert!(
    import_total("rent;120000\ncoffee;450\n").ok() == Some(120_450),
    "the total is the sum of the amounts of all lines"
);
assert!(
    import_total("\n\n   \nrent;1\n\n").ok() == Some(1),
    "blank lines, and lines of spaces only, are skipped"
);
assert!(
    import_total("a;4294967295\nb;4294967295").ok() == Some(8_589_934_590),
    "the total can be larger than the largest single amount"
);

// A bad amount: context on top, the typed error below it, the parse error at the root.
let error = import_total("rent;120000\n\ncoffee;4x0\nmilk;abc\n")
    .expect_err("an export with a bad amount is refused");
assert!(
    error.line() == 3,
    "the error names the first line that failed, and a blank line before it counts as a line"
);
assert!(
    error.to_string() == "cannot import line 3",
    "the message of an import error names the line and says nothing about the cause"
);
let cause = error.source();
assert!(cause.is_some(), "an import error exposes the line error as its source");
let cause = cause.expect("checked on the line above");
assert!(
    matches!(cause.downcast_ref::<LineError>(), Some(LineError::BadAmount(_))),
    "the source of an import error is the typed LineError, so code can still match on it"
);
assert!(
    cause.source().and_then(|root| root.downcast_ref::<ParseIntError>()).is_some(),
    "the chain ends at the ParseIntError: no layer dropped its cause"
);

// A missing amount and a missing label.
let error = import_total("rent;1\ncoffee\n").expect_err("a line without a semicolon is refused");
assert!(error.line() == 2, "the second line is line 2");
assert!(
    matches!(
        error.source().and_then(|cause| cause.downcast_ref::<LineError>()),
        Some(LineError::MissingField("amount"))
    ),
    "the source of the import error is the missing amount"
);

let error = import_total(";500").expect_err("a line without a label is refused");
assert!(error.line() == 1, "the first line is line 1, not line 0");
assert!(
    matches!(
        error.source().and_then(|cause| cause.downcast_ref::<LineError>()),
        Some(LineError::MissingField("label"))
    ),
    "the source of the import error is the missing label"
);

// The import stops at the first failure.
let error = import_total("a;1\nb;2\nc\nd;x\ne\n").expect_err("an export with three bad lines is refused");
assert!(error.line() == 3, "of several bad lines, the first one is reported");

// An import error can travel as an application's opaque error and be found again.
let boxed: Box<dyn Error + Send + Sync + 'static> = Box::new(error);
assert!(
    boxed.downcast_ref::<ImportError>().map(ImportError::line) == Some(3),
    "a boxed import error can be downcast back and still knows its line"
);
