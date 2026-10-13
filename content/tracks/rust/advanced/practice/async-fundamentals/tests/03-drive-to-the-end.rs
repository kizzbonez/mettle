use std::cell::Cell;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

// Kettles.
assert!(drive(Kettle::new(0)) == Some(("boiling", 1)), "a future that is ready at once takes exactly one poll");
assert!(drive(Kettle::new(1)) == Some(("boiling", 2)), "one Pending answer, then Ready: two polls");
assert!(drive(Kettle::new(25)) == Some(("boiling", 26)), "the polls are counted up to and including the one that was Ready");

// Async blocks. Calling one runs nothing: the body starts with the first poll.
let brewed = Cell::new(0);
let tea = async {
    brewed.set(brewed.get() + 1);
    String::from("tea")
};
assert!(brewed.get() == 0, "an async block that was not polled has not run");
assert!(drive(tea) == Some((String::from("tea"), 1)), "an async block without an await is ready on its first poll");
assert!(brewed.get() == 1, "drive runs the body of the future exactly once");

// `.await` passes the kettle's Pending on to the outer future.
let two_pots = async {
    let first = Kettle::new(2).await;
    let second = Kettle::new(1).await;
    format!("{first} and {second}")
};
assert!(
    drive(two_pots) == Some((String::from("boiling and boiling"), 4)),
    "two kettles awaited in turn: one poll for every Pending answer, plus the last one"
);

async fn steep(looks: u32) -> u32 {
    Kettle::new(looks).await;
    looks * 10
}
assert!(drive(steep(3)) == Some((30, 4)), "an async fn that awaits a kettle is driven like any other future");
assert!(
    drive(async { steep(1).await + steep(2).await }) == Some((30, 4)),
    "async functions awaited inside an async block"
);

// A future of the test's own. It asks for two wake-ups before each Pending,
// and counts how often it is polled.
struct Eager<'a> {
    pending_left: u32,
    polled: &'a Cell<u32>,
}
impl Future for Eager<'_> {
    type Output = u32;
    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<u32> {
        self.polled.set(self.polled.get() + 1);
        if self.pending_left == 0 {
            return Poll::Ready(99);
        }
        self.pending_left -= 1;
        cx.waker().wake_by_ref();
        cx.waker().clone().wake();
        Poll::Pending
    }
}
let polled = Cell::new(0);
assert!(
    drive(Eager { pending_left: 3, polled: &polled }) == Some((99, 4)),
    "a future that asks for a wake-up twice in one poll is still polled once for it"
);
assert!(polled.get() == 4, "a future is not polled again after it was Ready");
