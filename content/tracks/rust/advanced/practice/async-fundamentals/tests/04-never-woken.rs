use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::task::{Context, Poll};
use std::thread;
use std::time::Duration;

// A wrong `drive` can poll a stalled future for ever. So each call runs on a
// helper thread, and the test gives up after three seconds.
fn drive_or_fail<F>(future: F, checking: &str) -> Option<(F::Output, u32)>
where
    F: Future + Send + 'static,
    F::Output: Send + 'static,
{
    let (done, wait) = mpsc::channel();
    thread::spawn(move || done.send(drive(future)));
    match wait.recv_timeout(Duration::from_secs(3)) {
        Ok(result) => result,
        Err(RecvTimeoutError::Timeout) => {
            eprintln!("drive did not return: {checking}");
            std::process::exit(1);
        }
        Err(RecvTimeoutError::Disconnected) => {
            eprintln!("drive panicked: {checking}");
            std::process::exit(1);
        }
    }
}

// Answers Pending `woken` times with a wake-up, then Pending without one.
struct Stalls {
    woken: u32,
    polled: Arc<AtomicU32>,
}
impl Future for Stalls {
    type Output = u32;
    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<u32> {
        self.polled.fetch_add(1, Ordering::SeqCst);
        if self.woken > 0 {
            self.woken -= 1;
            cx.waker().wake_by_ref();
        }
        Poll::Pending
    }
}

// Sanity: a future that keeps its promise still comes to its end.
assert!(
    drive_or_fail(Kettle::new(2), "a kettle asks for a wake-up before every Pending answer") == Some(("boiling", 3)),
    "a future that asks for a wake-up before every Pending answer is driven to its end"
);

// Pending on the very first poll, without a wake-up.
let polled = Arc::new(AtomicU32::new(0));
let result = drive_or_fail(
    Stalls { woken: 0, polled: Arc::clone(&polled) },
    "a future that answers Pending without a wake-up can never be polled again",
);
assert!(result.is_none(), "a future that answers Pending without asking for a wake-up gives None");
assert!(polled.load(Ordering::SeqCst) == 1, "such a future is polled once and then left alone");

// Three polls with a wake-up, and then one without.
let polled = Arc::new(AtomicU32::new(0));
let result = drive_or_fail(
    Stalls { woken: 3, polled: Arc::clone(&polled) },
    "a wake-up counts only for the poll in which it was asked for",
);
assert!(result.is_none(), "a future that stops asking for wake-ups gives None, however often it asked before");
assert!(
    polled.load(Ordering::SeqCst) == 4,
    "the future is polled once for each wake-up it asked for, and not again after the poll without one"
);

// The standard library's future that is never ready and never wakes.
let result = drive_or_fail(std::future::pending::<String>(), "std::future::pending never asks for a wake-up");
assert!(result.is_none(), "std::future::pending gives None");

// A stall behind an await: the outer future passes the Pending on.
let polled = Arc::new(AtomicU32::new(0));
let inner = Stalls { woken: 1, polled: Arc::clone(&polled) };
let result = drive_or_fail(
    async move {
        Kettle::new(2).await;
        inner.await
    },
    "a future that stalls at a later await",
);
assert!(result.is_none(), "an async block that awaits a stalling future gives None");
assert!(
    polled.load(Ordering::SeqCst) == 2,
    "the stalling future behind the await is reached, woken once and then left alone"
);
