//! Watched Kettle
//!
//! A waker that counts, a future written by hand, and an executor small
//! enough to read in one go. Nothing here waits for time to pass.

use std::future::Future;
use std::pin::{Pin, pin};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::task::{Context, Poll, Wake, Waker};

/// A waker that does nothing but count how often it is called.
#[derive(Default)]
pub struct WakeCounter {
    wakes: AtomicUsize,
}

impl WakeCounter {
    /// The number of wake-ups asked for so far.
    pub fn count(&self) -> usize {
        self.wakes.load(Ordering::SeqCst)
    }
}

impl Wake for WakeCounter {
    fn wake(self: Arc<Self>) {
        self.wakes.fetch_add(1, Ordering::SeqCst);
    }
}

/// A kettle that boils after it has been looked at a number of times.
pub struct Kettle {
    looks_left: u32,
}

impl Kettle {
    /// A kettle that needs `looks` looks before it boils.
    pub fn new(looks: u32) -> Kettle {
        Kettle { looks_left: looks }
    }
}

impl Future for Kettle {
    type Output = &'static str;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<&'static str> {
        if self.looks_left == 0 {
            return Poll::Ready("boiling");
        }
        self.looks_left -= 1;
        // `Pending` is a promise that the waker will be called.
        cx.waker().wake_by_ref();
        Poll::Pending
    }
}

/// Polls `future` to its end. Returns the output and the number of polls, or
/// `None` if the future answered `Pending` without asking for a wake-up.
pub fn drive<F: Future>(future: F) -> Option<(F::Output, u32)> {
    let mut future = pin!(future);
    let counter = Arc::new(WakeCounter::default());
    let waker = Waker::from(Arc::clone(&counter));
    let mut cx = Context::from_waker(&waker);
    let mut polls = 0;
    loop {
        let wakes_before = counter.count();
        polls += 1;
        match future.as_mut().poll(&mut cx) {
            Poll::Ready(output) => return Some((output, polls)),
            Poll::Pending => {
                if counter.count() == wakes_before {
                    // Nothing else is running, so nobody will ever wake this future.
                    return None;
                }
            }
        }
    }
}
