use std::error::Error;
use std::fmt;

/// An error type of the test's own: `report` must walk any chain of causes,
/// not only the two types of this lab.
#[derive(Debug)]
struct Layer {
    message: &'static str,
    below: Option<Box<Layer>>,
}

impl fmt::Display for Layer {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.message)
    }
}

impl Error for Layer {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        self.below.as_deref().map(|layer| layer as &(dyn Error + 'static))
    }
}

fn chain(messages: &[&'static str]) -> Layer {
    let mut below = None;
    for &message in messages.iter().rev() {
        below = Some(Box::new(Layer { message, below }));
    }
    *below.expect("a chain needs at least one message")
}

// An error with no cause is one line, with no line break at the end.
assert!(
    report(&chain(&["disk full"])) == "error: disk full",
    "an error without a cause is reported on a single line that does not end in a line break"
);

// One cause.
assert!(
    report(&chain(&["cannot save", "disk full"])) == "error: cannot save\n  caused by: disk full",
    "a cause follows on its own line, indented by two spaces"
);

// A long chain: every cause, outermost first.
assert!(
    report(&chain(&["cannot close the month", "cannot save", "cannot write", "disk full"]))
        == "error: cannot close the month\n  caused by: cannot save\n  caused by: cannot write\n  caused by: disk full",
    "every cause of a chain of four is reported, in order from the outermost to the root"
);

// The chains of this lab.
let parse_text = "x".parse::<u32>().expect_err("x is not a number").to_string();
let error = import_total("rent;1\ncoffee;x").expect_err("a bad amount is refused");
let lines: Vec<String> = report(&error).lines().map(str::to_string).collect();
assert!(lines.len() == 3, "a failed import with a bad amount is reported as three lines");
assert!(
    lines[0] == "error: cannot import line 2",
    "the first line of the report is the context: what was being attempted"
);
assert!(
    lines[1] == "  caused by: amount is not a whole number of cents",
    "the second line of the report is the line error"
);
assert!(
    lines[2] == format!("  caused by: {parse_text}"),
    "the last line of the report is the parse error, and it appears only once"
);

let error = import_total(";5").expect_err("a missing label is refused");
assert!(
    report(&error) == "error: cannot import line 1\n  caused by: missing label field",
    "a failed import with a missing field is reported as two lines"
);

// The report starts wherever it is asked to start.
assert!(
    report(&LineError::MissingField("amount")) == "error: missing amount field",
    "a line error reported by itself starts the report"
);
let bad = parse_line("coffee;x").expect_err("a bad amount is refused");
assert!(
    report(&bad) == format!("error: amount is not a whole number of cents\n  caused by: {parse_text}"),
    "a line error with a cause is reported with that cause"
);
