//! Election Night
//!
//! Ballots are counted on threads: one spawned thread for each candidate, and
//! two scoped threads that check a pile of ballots by borrowing it.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::thread::{self, JoinHandle};

/// Starts a thread that counts the ballots for `candidate`, and returns its handle.
pub fn count_for(ballots: Vec<String>, candidate: &str) -> JoinHandle<usize> {
    // TODO 1: the new thread must own everything it uses
    todo!("count_for")
}

/// Waits for every count. A thread that panicked gives `None`.
pub fn collect_counts(handles: Vec<JoinHandle<usize>>) -> Vec<Option<usize>> {
    // TODO 2: join the handles in order
    todo!("collect_counts")
}

/// Counts the ballots that `is_valid` accepts, one half on each of two scoped threads.
pub fn count_valid<F>(ballots: &[String], is_valid: F) -> usize
where
    F: Fn(&str) -> bool + Sync,
{
    // TODO 3: split the slice in the middle and let two scoped threads borrow the halves
    todo!("count_valid")
}
