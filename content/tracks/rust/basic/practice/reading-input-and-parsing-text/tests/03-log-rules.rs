fn watering(plant: &str, milliliters: u32) -> Watering {
    Watering { plant: plant.to_string(), milliliters }
}

// Logs with nothing to report.
assert!(parse_log("") == Ok(vec![]), "an empty log is valid and has no waterings");
assert!(
    parse_log("\n   \n\t\n") == Ok(vec![]),
    "a log of empty lines and lines of whitespace is valid and has no waterings"
);

// Order is kept.
assert!(
    parse_log("mint = 100\nbasil = 200\nmint = 300\n")
        == Ok(vec![watering("mint", 100), watering("basil", 200), watering("mint", 300)]),
    "the waterings come back in the order of the lines, repeated plants included"
);

// The first bad line wins, and skipped lines still count.
let text = "basil = 250\n\n   \ntomato = lots\nno equals here\n";
assert!(
    parse_log(text) == Err((4, LogError::BadAmount("lots".to_string()))),
    "the first failing line is reported with its number counted from 1, blank lines included"
);
assert!(
    parse_log("basil\nbasil = 250\n") == Err((1, LogError::MissingEquals)),
    "an error on the very first line is reported as line 1"
);
assert!(
    parse_log("\n\n\n = 5\n") == Err((4, LogError::EmptyPlant)),
    "blank lines at the start of the log are counted too"
);
assert!(
    parse_log("mint = 100\nbasil = 0") == Err((2, LogError::BadAmount("0".to_string()))),
    "an error on the last line is found even without a final line ending"
);

// Line endings and a missing final newline.
assert!(
    parse_log("mint = 100\r\n\r\nbasil = 200") == Ok(vec![watering("mint", 100), watering("basil", 200)]),
    "Windows line endings and a missing final line ending are handled"
);
