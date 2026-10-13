assert!(is_paid("paid"), "the answer \"paid\" counts as paid");
assert!(!is_paid("unpaid"), "an answer that only contains the word paid does not count");
assert!(!is_paid(""), "an empty answer does not count as paid");
assert!(!is_paid("Paid"), "the comparison is exact, so a capital letter makes the answer different");
assert!(!is_paid("paid "), "the comparison is exact, so a space after the word makes the answer different");
assert!(!is_paid("no"), "any other answer does not count as paid");
