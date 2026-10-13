use std::future::Future;
use std::pin::pin;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::task::{Context, Poll, Wake, Waker};

// The lab's own waker.
let counter = Arc::new(WakeCounter::default());
assert!(counter.count() == 0, "a new counter has seen no wake-up");
let waker = Waker::from(Arc::clone(&counter));
waker.wake_by_ref();
assert!(counter.count() == 1, "one call of the waker is counted once");
let copy = waker.clone();
copy.wake();
waker.wake_by_ref();
assert!(counter.count() == 3, "every call is counted, through the waker and through a clone of it");
let other = Arc::new(WakeCounter::default());
Waker::from(Arc::clone(&other)).wake();
assert!(other.count() == 1 && counter.count() == 3, "each counter counts the calls of its own waker only");

// A waker of the test's own, so that the kettle is checked by itself.
struct Calls(AtomicUsize);
impl Wake for Calls {
    fn wake(self: Arc<Self>) {
        self.0.fetch_add(1, Ordering::SeqCst);
    }
}
let calls = Arc::new(Calls(AtomicUsize::new(0)));
let waker = Waker::from(Arc::clone(&calls));
let mut cx = Context::from_waker(&waker);

// A kettle that needs four looks.
let mut kettle = pin!(Kettle::new(4));
for look in 1..=4 {
    assert!(
        kettle.as_mut().poll(&mut cx).is_pending(),
        "a kettle answers Pending as long as looks are left"
    );
    assert!(
        calls.0.load(Ordering::SeqCst) == look,
        "every Pending answer comes with exactly one call of the waker"
    );
}
assert!(
    kettle.as_mut().poll(&mut cx) == Poll::Ready("boiling"),
    "a kettle is ready on the poll after its last look, with the output boiling"
);
assert!(
    calls.0.load(Ordering::SeqCst) == 4,
    "the Ready answer comes without a call of the waker"
);

// A kettle that needs no look at all.
let mut hot = pin!(Kettle::new(0));
assert!(
    hot.as_mut().poll(&mut cx) == Poll::Ready("boiling"),
    "a kettle that needs no look is ready on the first poll"
);
assert!(calls.0.load(Ordering::SeqCst) == 4, "a kettle that is ready at once never calls the waker");

// Two kettles keep their own count of looks.
let mut slow = pin!(Kettle::new(2));
let mut quick = pin!(Kettle::new(1));
assert!(slow.as_mut().poll(&mut cx).is_pending(), "the first look at a kettle that needs two");
assert!(quick.as_mut().poll(&mut cx).is_pending(), "the first look at a kettle that needs one");
assert!(quick.as_mut().poll(&mut cx).is_ready(), "the second look at the kettle that needs one");
assert!(slow.as_mut().poll(&mut cx).is_pending(), "the second look at the kettle that needs two");
assert!(slow.as_mut().poll(&mut cx).is_ready(), "the third look at the kettle that needs two");
