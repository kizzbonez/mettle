use std::cell::Cell;

// Any number of arguments.
assert!(average!(8.0) == 8.0, "the average of a single time is that time");
assert!(average!(10.0, 20.0) == 15.0, "the average of two times");
assert!(average!(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0) == 4.5, "the average of eight times");
assert!(average!(-4.0, 4.0) == 0.0, "times below and above zero");

// No arguments: a rule of its own.
let none: f64 = average!();
assert!(none == 0.0, "with no arguments the average is 0.0");

// A trailing comma, also in a call that is spread over several lines.
assert!(average!(3.0, 5.0,) == 4.0, "a trailing comma is allowed");
let heat = average!(
    11.0,
    12.0,
    13.0,
);
assert!(heat == 12.0, "a call written over several lines with a comma after the last time");

// Arguments are expressions, not only numbers.
let best = 9.5;
assert!(average!(best, best + 1.0, 2.0 * 3.0 + 4.0) == 10.0, "each argument is a whole expression");
assert!(average!(if best > 9.0 { 1.0 } else { 100.0 }, 3.0) == 2.0, "an argument can be an if expression");

// Hygiene: the caller's variables keep their meaning, whatever names the
// macro uses for its own.
let sum = 2.0;
let count = 4.0;
let total = 6.0;
assert!(average!(sum, count, total) == 4.0, "variables of the caller are used as they are, whatever they are called");

// Every argument is evaluated exactly once.
let calls = Cell::new(0);
let stopwatch = || {
    calls.set(calls.get() + 1);
    7.0
};
assert!(average!(stopwatch(), 9.0, 8.0) == 8.0, "an argument that is a function call");
assert!(calls.get() == 1, "an argument is evaluated exactly once");
let result = average!(stopwatch(), stopwatch(), stopwatch(), stopwatch());
assert!(result == 7.0 && calls.get() == 5, "each of four arguments is evaluated exactly once");
