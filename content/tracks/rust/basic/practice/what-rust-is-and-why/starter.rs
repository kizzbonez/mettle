// First Run
//
// This file is a complete Rust program, like the first one in the lesson.
// The tests run `main` and read what it prints.
//
// The word `pub` in front of `fn main` is the only new thing here. It lets
// the tests reach the function, so leave it where it is.

pub fn main() {
    // YOUR CODE: a fourth basket has arrived, and it holds 7 apples.
    // Change the list on the next line so that it describes four baskets.
    let baskets = [14, 9, 20];

    let mut total = 0;
    for count in baskets {
        total += count;
    }
    println!("{} baskets hold {total} apples", baskets.len());
}
