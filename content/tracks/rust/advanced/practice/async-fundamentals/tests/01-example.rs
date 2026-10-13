use std::future::Future;
use std::pin::pin;
use std::sync::Arc;
use std::sync::mpsc;
use std::task::{Context, Poll, Waker};
use std::thread;
use std::time::Duration;

// A waker that counts.
let counter = Arc::new(WakeCounter::default());
let waker = Waker::from(Arc::clone(&counter));
waker.wake_by_ref();
waker.wake_by_ref();
assert_eq!(counter.count(), 2, "the count after the waker was called twice");

// A kettle, polled by hand.
let mut cx = Context::from_waker(&waker);
let mut kettle = pin!(Kettle::new(1));
assert_eq!(kettle.as_mut().poll(&mut cx), Poll::Pending, "the first look at a kettle that needs one look");
assert_eq!(counter.count(), 3, "the count after the kettle answered Pending once");
assert_eq!(kettle.as_mut().poll(&mut cx), Poll::Ready("boiling"), "the second look at that kettle");

// The same thing, driven by your executor.
assert_eq!(drive(Kettle::new(3)), Some(("boiling", 4)), "a kettle that needs three looks, driven to its end");
assert_eq!(
    drive(async { Kettle::new(2).await.len() }),
    Some((7, 3)),
    "an async block that awaits a kettle and returns the length of its answer"
);

// A future that answers Pending and never asks for a wake-up. A `drive` that
// polls it again and again would never return, so this call runs on a helper
// thread and the test gives up after three seconds.
let (done, wait) = mpsc::channel();
thread::spawn(move || done.send(drive(std::future::pending::<u32>())));
let Ok(stalled) = wait.recv_timeout(Duration::from_secs(3)) else {
    panic!("drive returns when a future answers Pending without asking for a wake-up");
};
assert_eq!(stalled, None, "what drive returns for a future that will never be woken");
