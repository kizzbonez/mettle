Each function in the starter is nearly complete. Write only where a comment says `YOUR CODE`,
and keep the last line of each function, which hands the result to the tests. The names in the
parentheses of a function, such as `hours`, are variables that the tests fill in. Use them like
a variable made with `let`.

1. `parking_fee(hours: u32) -> u32` is the fee in cents. Above the function, declare a constant
   named `CENTS_PER_HOUR` of type `u32` with the value `250`. Inside the function, multiply
   `hours` by that constant.
2. `free_spaces(spaces: u32, arrived: u32, left: u32) -> u32` starts with `spaces` free spaces.
   Make `free` mutable, then subtract the cars that arrived and add the cars that left.
3. `is_paid(answer: &str) -> bool` is `true` only when `answer` is exactly the text `paid`, in
   lower case and with nothing before or after it. Shadow `answer` with the result of a
   comparison.
4. `print_ticket(bay: u32, plate: &str, due: f64)` prints one line with `println!`. Its parts,
   from left to right:
   - the word `Bay`, a space, then `bay` aligned to the right in a field four characters wide;
   - a colon and a space, then `plate` in its debug form, which puts it in quotes;
   - the word `owes` with one space on each side, then `due` with two digits after the decimal
     point.

Example:

```rust
parking_fee(3)          // 750
free_spaces(40, 12, 5)  // 33
is_paid("paid")         // true
is_paid("not yet")      // false
print_ticket(7, "AB 123", 7.5);
```

The last call prints this line:

```text
Bay    7: "AB 123" owes 7.50
```

**Tip:** if the compiler answers task 2 with `E0384`, read its `help` line. It is the error
from the lesson, and it shows the word that is missing.
