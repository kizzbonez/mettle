use std::sync::mpsc;
use std::thread::{self, JoinHandle};

// A thread that returns a count, and one that panics without printing a message.
fn counted(count: usize) -> JoinHandle<usize> {
    thread::spawn(move || count)
}
fn dropped() -> JoinHandle<usize> {
    thread::spawn(|| -> usize { std::panic::resume_unwind(Box::new("the pile fell on the floor")) })
}

assert!(collect_counts(Vec::new()).is_empty(), "no handles give no counts");
assert!(collect_counts(vec![counted(7)]) == [Some(7)], "one thread that returned a count");
assert!(
    collect_counts(vec![dropped()]) == [None],
    "a thread that panicked gives None, and collect_counts carries on without a panic of its own"
);

assert!(
    collect_counts(vec![counted(5), counted(0), counted(12), counted(5)]) == [Some(5), Some(0), Some(12), Some(5)],
    "the counts come back in the order of the handles, and a count of 0 is still Some"
);
assert!(
    collect_counts(vec![dropped(), counted(4), dropped(), dropped(), counted(9)])
        == [None, Some(4), None, None, Some(9)],
    "every handle gets an entry at its own position, whether its thread panicked or not"
);
assert!(
    collect_counts(vec![dropped(), dropped()]) == [None, None],
    "threads that all panicked give one None each"
);

// The first thread cannot finish until the last one has: results still come
// back in the order of the handles, not in the order the threads ended.
let (done, wait) = mpsc::channel::<()>();
let slow = thread::spawn(move || {
    let _ = wait.recv();
    1
});
let quick = counted(2);
let last = thread::spawn(move || {
    let _ = done.send(());
    3
});
assert!(
    collect_counts(vec![slow, quick, last]) == [Some(1), Some(2), Some(3)],
    "a thread that ends late keeps its place in the result"
);
