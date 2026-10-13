//! Quiz Night
//!
//! Two ways of running futures at the same time on one thread: wait for all
//! of them, or take the first one that is ready and drop the other.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::future::{Future, poll_fn};
use std::pin::{Pin, pin};
use std::task::{Context, Poll, Waker};

/// Given: a future that answers `Pending` `polls` times and is then ready with `value`.
pub async fn after(polls: u32, value: u32) -> u32 {
    let mut left = polls;
    poll_fn(|cx| {
        if left == 0 {
            return Poll::Ready(());
        }
        left -= 1;
        cx.waker().wake_by_ref(); // ask to be polled again
        Poll::Pending
    })
    .await;
    value
}

/// Given: polls `future` to its end and returns its output with the number of polls.
///
/// A real executor sleeps until the waker is called. This one simply polls
/// again, which is all it takes to count polls. It gives up after 1000 of them.
pub fn drive<F: Future>(future: F) -> (F::Output, u32) {
    let mut future = pin!(future);
    let mut cx = Context::from_waker(Waker::noop());
    for polls in 1..=1000 {
        if let Poll::Ready(output) = future.as_mut().poll(&mut cx) {
            return (output, polls);
        }
    }
    panic!("the future was still not ready after 1000 polls");
}

/// Waits for every sheet and returns the answers in the order of the sheets.
pub async fn collect_sheets(mut sheets: Vec<Pin<Box<dyn Future<Output = u32>>>>) -> Vec<u32> {
    // TODO 1: keep a place for each answer, and give every sheet that is
    //         still out one poll each time this future is polled
    todo!("collect_sheets")
}

/// The answer of whichever future is ready first. The other one is dropped.
pub async fn first_buzz<A, B>(a: A, b: B) -> A::Output
where
    A: Future,
    B: Future<Output = A::Output>,
{
    // TODO 2: pin both futures, then poll `a` and `b` in that order each
    //         time this future is polled
    todo!("first_buzz")
}
