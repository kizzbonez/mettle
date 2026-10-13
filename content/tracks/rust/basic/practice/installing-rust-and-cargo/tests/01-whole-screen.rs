// This test calls your three functions and then prints the seat number F7
// itself. `printed_by` gives the test everything that this code printed, and
// the test shows it to you and compares it with the screen from the
// instructions.
let printed = printed_by(|| {
    welcome();
    showings();
    seat_label();
    println!("F7");
});

println!("Your functions and the seat number printed:");
print!("{printed}");

// In the two texts below, `\n` marks the end of a line.
assert_eq!(
    printed,
    "Welcome to the Roxy!\nScreen 1: The Long Voyage\nScreen 2: Night Train\nYour seat: F7\n",
    "the whole screen: welcome, showings, then the seat label with F7 on the same line"
);
