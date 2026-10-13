let printed = printed_by(seat_label);

assert!(!printed.is_empty(), "seat_label prints something");
assert!(
    !printed.contains('\n'),
    "seat_label does not end its line, so the seat number can follow on the same line"
);
assert!(
    printed == "Your seat: ",
    "the text of the seat label, with exactly one space after the colon"
);
