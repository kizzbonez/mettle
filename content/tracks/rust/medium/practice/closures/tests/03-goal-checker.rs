let reached = goal_checker(10_000);
assert!(reached(10_000), "exactly the goal reaches the goal");
assert!(!reached(9_999), "one step short does not reach the goal");
assert!(reached(10_001), "one step more reaches the goal");
assert!(!reached(0), "no steps at all do not reach a goal of 10000");
assert!(
    reached(10_000) && reached(25_000) && !reached(1),
    "the closure can be called again and again, with the same goal every time"
);

// A goal of zero is always reached.
let easy = goal_checker(0);
assert!(easy(0) && easy(1), "a goal of 0 is reached by any number of steps");

// Each closure owns its own goal.
let low = goal_checker(3_000);
let high = goal_checker(12_000);
assert!(low(5_000) && !high(5_000), "two checkers keep two separate goals");

// The closure owns a copy, so the variable it was made from is free.
let mut goal = 6_000;
let check = goal_checker(goal);
goal = 20_000;
assert!(check(7_000), "changing the variable afterwards does not change the goal inside the closure");
assert!(goal == 20_000, "the variable itself was changed");

// It only reads its capture, so it can be lent to code that asks for `Fn`.
fn good_days(days: &[u32], check: &impl Fn(u32) -> bool) -> u32 {
    let mut count = 0;
    for &steps in days {
        if check(steps) {
            count += 1;
        }
    }
    count
}
let week = [4_000, 10_000, 12_500, 9_999, 10_000, 0, 30_000];
assert!(good_days(&week, &reached) == 4, "the checker counts the days of a week that reach the goal");
assert!(good_days(&week, &reached) == 4, "using the checker does not use it up");
