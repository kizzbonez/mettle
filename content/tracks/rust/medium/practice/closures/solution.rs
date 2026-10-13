//! Step Counter
//!
//! Five small functions for a fitness wristband. Three take a closure and
//! ask for the right one of `Fn`, `FnMut` and `FnOnce`. Two return a closure
//! that owns what it captured.

/// The result of `adjust` for each day's steps, in order.
///
/// The closure is called many times and only needs to read, so `Fn` will do.
pub fn adjust_all<F: Fn(u32) -> u32>(steps: &[u32], adjust: F) -> Vec<u32> {
    let mut adjusted = Vec::new();
    for &count in steps {
        adjusted.push(adjust(count));
    }
    adjusted
}

/// Calls `action` exactly `times` times.
///
/// Several calls, and the action may change its captures: `FnMut`.
pub fn repeat<F: FnMut()>(times: u32, mut action: F) {
    for _ in 0..times {
        action();
    }
}

/// Calls `message` once and frames its text as `>> text <<`.
///
/// One call only: `FnOnce` accepts every closure.
pub fn announce<F: FnOnce() -> String>(message: F) -> String {
    format!(">> {} <<", message())
}

/// A closure that says whether a day's steps reach `goal`.
pub fn goal_checker(goal: u32) -> impl Fn(u32) -> bool {
    // `move`: the closure outlives this function, so it owns its copy of `goal`.
    move |steps| steps >= goal
}

/// A closure that is fed one day's steps per call and returns the streak.
pub fn streak_counter(goal: u32) -> impl FnMut(u32) -> u32 {
    let mut streak = 0;
    // `move` takes `streak` along, so every closure counts for itself.
    move |steps| {
        if steps >= goal {
            streak += 1;
        } else {
            streak = 0;
        }
        streak
    }
}
