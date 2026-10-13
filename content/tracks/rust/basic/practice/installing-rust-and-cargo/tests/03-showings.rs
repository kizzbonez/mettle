let printed = printed_by(showings);

let lines: Vec<&str> = printed.lines().collect();
assert!(
    lines.len() == 2 && printed.ends_with('\n'),
    "showings prints exactly two lines and ends both of them"
);
assert!(
    lines[0] == "Screen 1: The Long Voyage",
    "the first line is the showing on screen 1, written exactly as in the instructions"
);
assert!(
    lines[1] == "Screen 2: Night Train",
    "the second line is the showing on screen 2, written exactly as in the instructions"
);
