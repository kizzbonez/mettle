//! Election Night
//!
//! Ballots are counted on threads: one spawned thread for each candidate, and
//! two scoped threads that check a pile of ballots by borrowing it.

use std::thread::{self, JoinHandle};

/// Starts a thread that counts the ballots for `candidate`, and returns its handle.
pub fn count_for(ballots: Vec<String>, candidate: &str) -> JoinHandle<usize> {
    // The thread may still run after the caller's `candidate` is gone, so it
    // gets a `String` of its own. `move` gives it that and the ballots.
    let candidate = candidate.to_string();
    thread::spawn(move || ballots.iter().filter(|ballot| **ballot == candidate).count())
}

/// Waits for every count. A thread that panicked gives `None`.
pub fn collect_counts(handles: Vec<JoinHandle<usize>>) -> Vec<Option<usize>> {
    let mut counts = Vec::new();
    for handle in handles {
        // `join` returns `Err` when the thread panicked.
        counts.push(handle.join().ok());
    }
    counts
}

/// Counts the ballots that `is_valid` accepts, one half on each of two scoped threads.
pub fn count_valid<F>(ballots: &[String], is_valid: F) -> usize
where
    F: Fn(&str) -> bool + Sync,
{
    let (left, right) = ballots.split_at(ballots.len() / 2);
    // Scoped threads are joined before `scope` returns, so they may borrow
    // `left`, `right` and `is_valid`.
    thread::scope(|s| {
        let first = s.spawn(|| left.iter().filter(|ballot| is_valid(ballot)).count());
        let second = s.spawn(|| right.iter().filter(|ballot| is_valid(ballot)).count());
        first.join().unwrap() + second.join().unwrap()
    })
}
