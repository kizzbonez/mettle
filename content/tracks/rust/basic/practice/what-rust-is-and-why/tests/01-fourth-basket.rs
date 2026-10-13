// This test runs your program, shows you what it printed, and compares that
// with the line from the instructions. `printed_by` gives the test whatever
// the code in its parentheses printed, and `solution::main` is the `main`
// function in your file.
let printed = printed_by(solution::main);

println!("Your program printed:");
print!("{printed}");

assert_eq!(
    printed.trim_end(),
    "4 baskets hold 50 apples",
    "the line the program prints for four baskets"
);
