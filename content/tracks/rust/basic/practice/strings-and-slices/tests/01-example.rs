// Each line calls one of your functions and compares the result with the
// example in the instructions.
assert_eq!(
    badge_line("  ada lovelace ", " Analytical Engines "),
    "ADA LOVELACE, Analytical Engines",
    "the badge line for an untidy name and company"
);
assert_eq!(letter_count("Ada Lovelace"), 11, "the characters of Ada Lovelace that are not spaces");
assert_eq!(ticket_kind("VIP-0042"), "VIP", "the kind of the ticket VIP-0042");
assert_eq!(
    count_sessions("rust, wasm, , testing"),
    3,
    "the sessions in a list of four entries, one of them blank"
);
