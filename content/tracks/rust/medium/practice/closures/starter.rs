//! Step Counter
//!
//! Five small functions for a fitness wristband. Three take a closure and
//! must ask for the right one of `Fn`, `FnMut` and `FnOnce`. Two return a
//! closure that owns what it captured.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// The result of `adjust` for each day's steps, in order.
// TODO 1: give `F` its bound: which trait, what it takes and what it returns.
pub fn adjust_all<F>(steps: &[u32], adjust: F) -> Vec<u32> {
    todo!("adjust_all")
}

/// Calls `action` exactly `times` times.
// TODO 2: give `F` its bound. The action may change what it captured.
pub fn repeat<F>(times: u32, action: F) {
    todo!("repeat")
}

/// Calls `message` once and frames its text as `>> text <<`.
// TODO 3: give `F` its bound. The closure may give away what it captured.
pub fn announce<F>(message: F) -> String {
    todo!("announce")
}

/// A closure that says whether a day's steps reach `goal`.
pub fn goal_checker(goal: u32) -> impl Fn(u32) -> bool {
    // TODO 4: replace this closure with one that uses `goal`.
    |_steps| todo!("goal_checker")
}

/// A closure that is fed one day's steps per call and returns the streak.
pub fn streak_counter(goal: u32) -> impl FnMut(u32) -> u32 {
    // TODO 5: replace this closure with one that keeps a count of its own.
    |_steps| todo!("streak_counter")
}
