// A streak grows by one for every day on or above the goal.
let mut streak = streak_counter(5_000);
assert!(streak(5_000) == 1, "a first day exactly on the goal starts a streak of 1");
assert!(streak(7_500) == 2, "a second good day makes 2");
assert!(streak(5_001) == 3, "a third good day makes 3");
assert!(streak(4_999) == 0, "one step short of the goal sets the streak back to 0");
assert!(streak(0) == 0, "a second bad day leaves the streak at 0");
assert!(streak(9_000) == 1, "the first good day after a break starts again at 1");
assert!(streak(9_000) == 2, "and the streak grows again from there");

// A counter that starts with a bad day.
let mut slow_start = streak_counter(8_000);
assert!(slow_start(10) == 0, "a first day below the goal gives a streak of 0");
assert!(slow_start(8_000) == 1, "the day after it starts the streak");

// Every closure has a count of its own.
let mut ada = streak_counter(1_000);
let mut bo = streak_counter(1_000);
ada(2_000);
ada(2_000);
assert!(bo(2_000) == 1, "a second counter starts from nothing, whatever the first one has counted");
assert!(ada(2_000) == 3, "the first counter carries on from its own count");

// Each counter keeps the goal it was made with.
let mut low = streak_counter(100);
let mut high = streak_counter(50_000);
assert!(low(600) == 1 && high(600) == 0, "the same day counts for a low goal and not for a high one");
assert!(low(600) == 2 && high(60_000) == 1, "each counter goes on with its own goal and its own count");

// A long run.
let mut month = streak_counter(1);
let mut last = 0;
for _ in 0..30 {
    last = month(1);
}
assert!(last == 30, "thirty good days in a row make a streak of 30");
