// The example from the instructions.

// This closure only reads `bonus`.
let bonus = 500;
assert_eq!(
    adjust_all(&[4000, 9500], |steps: u32| steps + bonus),
    [4500, 10000],
    "two days of steps with 500 added to each"
);

// This one changes `buzzes`, so it builds only where `FnMut` is accepted.
let mut buzzes = 0;
repeat(3, || buzzes += 1);
assert_eq!(buzzes, 3, "a counter after repeat was asked for 3 calls");

// This one gives `name` away, so it builds only where `FnOnce` is accepted.
let name = String::from("Ada");
assert_eq!(announce(move || name), ">> Ada <<", "the framed text of a message that says Ada");

let reached = goal_checker(8000);
assert_eq!(reached(9500), true, "9500 steps against a goal of 8000");
assert_eq!(reached(4000), false, "4000 steps against a goal of 8000");

let mut streak = streak_counter(8000);
assert_eq!(streak(9000), 1, "the streak after a first day above the goal");
assert_eq!(streak(8000), 2, "the streak after a second day, exactly on the goal");
assert_eq!(streak(100), 0, "the streak after a day below the goal");
assert_eq!(streak(8500), 1, "the streak after the next day above the goal");
