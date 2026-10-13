// The first three functions hand their result back, so the test compares it
// directly. `print_ticket` prints its line instead, and `printed_by` gives
// the test whatever the code in its parentheses printed.
assert_eq!(parking_fee(3), 750, "the fee in cents for 3 hours");
assert_eq!(free_spaces(40, 12, 5), 33, "free spaces out of 40 after 12 cars arrived and 5 left");
assert_eq!(is_paid("paid"), true, "whether the answer \"paid\" counts as paid");
assert_eq!(is_paid("not yet"), false, "whether the answer \"not yet\" counts as paid");

let printed = printed_by(|| print_ticket(7, "AB 123", 7.5));

println!("print_ticket(7, \"AB 123\", 7.5) printed:");
print!("{printed}");

// In the two texts below, `\"` is a quote character and `\n` ends the line.
assert_eq!(
    printed,
    "Bay    7: \"AB 123\" owes 7.50\n",
    "the line that print_ticket prints for bay 7"
);
