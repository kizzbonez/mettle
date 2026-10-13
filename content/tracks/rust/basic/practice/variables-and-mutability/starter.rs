// Pay Station
//
// The tests call the four functions below. Each one is nearly complete:
// write only where a comment says YOUR CODE, and keep the last line of each
// function, which hands the result to the tests.
//
// The names in the parentheses, such as `hours`, are variables that the
// tests fill in. Use them like a variable made with `let`. Later lessons
// explain the parts you have not met yet, such as `pub fn` and `-> u32`.

// YOUR CODE (task 1): declare a constant named CENTS_PER_HOUR on the next
// line. Its type is u32 and its value is 250.

// The fee in cents for a number of hours.
pub fn parking_fee(hours: u32) -> u32 {
    // YOUR CODE (task 1): multiply by your constant instead of by 0.
    let fee = hours * 0;

    fee
}

// The number of free spaces after some cars arrived and some left.
pub fn free_spaces(spaces: u32, arrived: u32, left: u32) -> u32 {
    // YOUR CODE (task 2): `free` has to change, so make it mutable. Then
    // subtract `arrived` from it and add `left` to it.
    let free = spaces;

    free
}

// Whether the driver's answer is exactly the text `paid`.
pub fn is_paid(answer: &str) -> bool {
    // YOUR CODE (task 3): replace the next line. Shadow `answer` with a
    // true-or-false value that says whether it equals "paid".
    let answer = false;

    answer
}

// Prints one line of the attendant's list.
pub fn print_ticket(bay: u32, plate: &str, due: f64) {
    // YOUR CODE (task 4): change the format string so that the line follows
    // the instructions.
    println!("{bay} {plate} {due}");
}
