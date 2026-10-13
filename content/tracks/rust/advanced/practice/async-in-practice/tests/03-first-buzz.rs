use std::cell::{Cell, RefCell};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll, Waker};

// A team of the test's own. It answers Pending `waits` times, asking for a
// wake-up each time, then Ready(answer). It counts its polls and writes a
// line in the log when it is dropped.
struct Team {
    name: &'static str,
    waits: u32,
    answer: u32,
    polls: Rc<Cell<u32>>,
    log: Rc<RefCell<Vec<String>>>,
    finished: bool,
}
impl Future for Team {
    type Output = u32;
    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<u32> {
        assert!(!self.finished, "a future that has answered Ready is never polled again");
        self.polls.set(self.polls.get() + 1);
        if self.waits == 0 {
            self.finished = true;
            return Poll::Ready(self.answer);
        }
        self.waits -= 1;
        cx.waker().wake_by_ref();
        Poll::Pending
    }
}
impl Drop for Team {
    fn drop(&mut self) {
        self.log.borrow_mut().push(format!("{} dropped", self.name));
    }
}

let log: Rc<RefCell<Vec<String>>> = Rc::new(RefCell::new(Vec::new()));
let team = |name: &'static str, waits: u32, answer: u32| {
    let polls = Rc::new(Cell::new(0));
    (Team { name, waits, answer, polls: Rc::clone(&polls), log: Rc::clone(&log), finished: false }, polls)
};
let mut cx = Context::from_waker(Waker::noop());

// The second future is ready first. The test polls by hand.
let (slow, slow_polls) = team("slow", 5, 1);
let (quick, quick_polls) = team("quick", 2, 2);
let mut race = Box::pin(first_buzz(slow, quick));
assert!(race.as_mut().poll(&mut cx).is_pending(), "first_buzz is Pending while neither future is ready");
assert!(
    (slow_polls.get(), quick_polls.get()) == (1, 1),
    "one poll of first_buzz polls both futures once when the first is not ready"
);
assert!(race.as_mut().poll(&mut cx).is_pending(), "first_buzz stays Pending until one future is ready");
assert!(
    race.as_mut().poll(&mut cx) == Poll::Ready(2),
    "first_buzz is ready with the answer of the second future when that one is ready first"
);
assert!((slow_polls.get(), quick_polls.get()) == (3, 3), "both futures were polled once in each of the three polls");
assert!(
    log.borrow().iter().any(|line| line == "slow dropped"),
    "the slower future is dropped as soon as first_buzz has its answer"
);
drop(race);
assert!(slow_polls.get() == 3, "the cancelled future is not polled again");
assert!(log.borrow().len() == 2, "each of the two futures is dropped exactly once");

// The first future is ready first.
let (quick, quick_polls) = team("quick", 1, 7);
let (slow, slow_polls) = team("slow", 4, 8);
assert!(drive(first_buzz(quick, slow)) == (7, 2), "the first future wins when it is ready first");
assert!(
    (quick_polls.get(), slow_polls.get()) == (2, 1),
    "the second future is not polled in the poll in which the first one is ready"
);

// A tie: both would be ready on the same poll.
let (first, first_polls) = team("first", 2, 100);
let (second, second_polls) = team("second", 2, 200);
assert!(drive(first_buzz(first, second)) == (100, 3), "when both are ready on the same poll, the first future wins");
assert!(
    (first_polls.get(), second_polls.get()) == (3, 2),
    "on a tie the second future is not polled in the last poll"
);

let (first, _) = team("first", 0, 5);
let (second, second_polls) = team("second", 0, 6);
assert!(drive(first_buzz(first, second)) == (5, 1), "a first future that is ready at once wins on the first poll");
assert!(second_polls.get() == 0, "the second future is never polled when the first is ready at once");

// One side is never ready at all.
let (ready, _) = team("ready", 3, 9);
assert!(
    drive(first_buzz(std::future::pending::<u32>(), ready)) == (9, 4),
    "a first future that is never ready does not hold up the second"
);
let (ready, _) = team("ready", 3, 9);
assert!(
    drive(first_buzz(ready, std::future::pending::<u32>())) == (9, 4),
    "a second future that is never ready does not hold up the first"
);

// Cancellation reaches into an async block: it stops at its last await.
let notes: RefCell<Vec<&str>> = RefCell::new(Vec::new());
let (inner, inner_polls) = team("inner", 6, 0);
let slow = async {
    notes.borrow_mut().push("slow started");
    inner.await;
    notes.borrow_mut().push("slow finished");
    1
};
let quick = async {
    after(2, 0).await;
    2
};
assert!(drive(first_buzz(slow, quick)) == (2, 3), "an async block that is slower loses the race");
assert!(
    *notes.borrow() == ["slow started"],
    "the cancelled block ran up to its await and never ran the code after it"
);
assert!(inner_polls.get() == 3, "the future inside the cancelled block was polled until the race was over");
assert!(
    log.borrow().iter().any(|line| line == "inner dropped"),
    "what the cancelled block was holding is dropped with it"
);
