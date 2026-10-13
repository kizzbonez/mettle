let line = printed_by(|| print_ticket(3, "KLM 88", 2.5));
assert!(
    line.lines().count() == 1 && line.ends_with('\n'),
    "print_ticket prints exactly one line and ends it"
);
assert!(
    line.starts_with("Bay    3: "),
    "a one-digit bay is aligned to the right in a field four characters wide, then a colon and a space"
);
assert!(
    line.contains(": \"KLM 88\" owes "),
    "the plate is printed in its debug form, in quotes, between the colon and the word owes"
);
assert!(
    line.ends_with(" owes 2.50\n"),
    "the amount due always has two digits after the decimal point"
);

assert!(
    printed_by(|| print_ticket(42, "Z 9", 12.0)) == "Bay   42: \"Z 9\" owes 12.00\n",
    "a two-digit bay is padded to four characters, and a whole amount still gets two decimals"
);
assert!(
    printed_by(|| print_ticket(1234, "QRS 456", 3.14159)) == "Bay 1234: \"QRS 456\" owes 3.14\n",
    "a four-digit bay fills the field exactly, and a long amount is cut to two decimals"
);
assert!(
    printed_by(|| print_ticket(12345, "", 0.0)) == "Bay 12345: \"\" owes 0.00\n",
    "a bay wider than the field is printed in full, and an empty plate is still shown in quotes"
);
