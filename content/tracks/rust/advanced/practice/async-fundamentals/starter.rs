//! Watched Kettle
//!
//! A waker that counts, a future written by hand, and an executor small
//! enough to read in one go. Nothing here waits for time to pass.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

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
        todo!("WakeCounter::wake")
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
        // TODO 2: one look at the kettle
        todo!("Kettle::poll")
    }
}

/// Polls `future` to its end. Returns the output and the number of polls, or
/// `None` if the future answered `Pending` without asking for a wake-up.
pub fn drive<F: Future>(future: F) -> Option<(F::Output, u32)> {
    // TODO 3: pin the future, build a `Waker` from an `Arc<WakeCounter>` and a
    //         `Context` from the waker, then poll in a loop
    todo!("drive")
}
