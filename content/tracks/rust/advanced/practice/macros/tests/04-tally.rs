use std::cell::Cell;

// The variable is the caller's: it is declared here, under the name given.
tally!(gold = 3, 4, 5);
assert!(gold == 12, "tally! declares a variable with the caller's name that holds the sum");

tally!(single = 7);
assert!(single == 7, "one expression after the = is enough");

tally!(with_comma = 1, 2,);
assert!(with_comma == 3, "a trailing comma is allowed");

// Two tallies live side by side, and the first is still there.
tally!(red = 10, 20);
tally!(blue = 5, 5, 5, 5, 5);
assert!(red == 30 && blue == 25 && gold == 12, "each tally! declares its own variable and leaves the others alone");

// Arguments are expressions, and may use the caller's variables.
let total = 100;
let sum = 1;
tally!(grand = total, sum, red + blue, 2 * 3);
assert!(grand == 162, "expressions and the caller's variables are added up");
assert!(total == 100 && sum == 1, "variables of the caller keep their values, whatever they are called");

// A new tally under a name that exists shadows it, like any `let`.
tally!(gold = gold, 1);
assert!(gold == 13, "a tally can use the old value of the name it declares again");

// Every argument is evaluated exactly once.
let calls = Cell::new(0);
let judge = || {
    calls.set(calls.get() + 1);
    6
};
tally!(judged = judge(), judge(), 1);
assert!(judged == 13 && calls.get() == 2, "each argument is evaluated exactly once");

// The variable is an ordinary one: it can be used in later code.
let doubled: u32 = judged * 2;
assert!(doubled == 26, "the declared variable is an ordinary number that later code can use");
