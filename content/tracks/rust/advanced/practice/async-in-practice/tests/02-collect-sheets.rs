use std::cell::Cell;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll, Waker};

// A sheet of the test's own. It answers Pending `waits` times, asking for a
// wake-up each time, then Ready(answer), and it counts its polls.
struct Sheet {
    waits: u32,
    answer: u32,
    polls: Rc<Cell<u32>>,
    finished: bool,
}
impl Future for Sheet {
    type Output = u32;
    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<u32> {
        assert!(!self.finished, "a sheet that has answered Ready is never polled again");
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

// Builds the sheets and hands back the poll counter of each one.
fn sheets(specs: &[(u32, u32)]) -> (Vec<Pin<Box<dyn Future<Output = u32>>>>, Vec<Rc<Cell<u32>>>) {
    let mut boxed: Vec<Pin<Box<dyn Future<Output = u32>>>> = Vec::new();
    let mut counters = Vec::new();
    for (waits, answer) in specs {
        let polls = Rc::new(Cell::new(0));
        counters.push(Rc::clone(&polls));
        boxed.push(Box::pin(Sheet { waits: *waits, answer: *answer, polls, finished: false }));
    }
    (boxed, counters)
}
fn counts(counters: &[Rc<Cell<u32>>]) -> Vec<u32> {
    counters.iter().map(|polls| polls.get()).collect()
}

let mut cx = Context::from_waker(Waker::noop());

// Three sheets that need 3, 1 and 0 Pending answers. The test polls by hand.
let (boxed, counters) = sheets(&[(3, 10), (1, 20), (0, 30)]);
let mut all = Box::pin(collect_sheets(boxed));
assert!(counts(&counters) == [0, 0, 0], "nothing is polled before collect_sheets itself is polled");

assert!(all.as_mut().poll(&mut cx).is_pending(), "collect_sheets is not ready while a sheet is still out");
assert!(
    counts(&counters) == [1, 1, 1],
    "the first poll of collect_sheets polls every sheet once, not only the first one"
);
assert!(all.as_mut().poll(&mut cx).is_pending(), "collect_sheets stays Pending until the last sheet is in");
assert!(
    counts(&counters) == [2, 2, 1],
    "the second poll polls the sheets that are still out and leaves the finished one alone"
);
assert!(all.as_mut().poll(&mut cx).is_pending(), "one sheet out of three is still out after three polls");
assert!(counts(&counters) == [3, 2, 1], "the third poll polls only the one sheet that is still out");
assert!(
    all.as_mut().poll(&mut cx) == Poll::Ready(vec![10, 20, 30]),
    "collect_sheets is ready on the poll in which the last sheet is ready, with the answers in the order of the sheets"
);
assert!(counts(&counters) == [4, 2, 1], "each sheet was polled exactly as often as it needed");

// The slowest sheet last, first and in the middle: the order of the answers
// never follows the order of finishing.
for specs in [[(0, 1), (2, 2), (5, 3)], [(5, 1), (2, 2), (0, 3)], [(1, 1), (6, 2), (1, 3)]] {
    let (boxed, counters) = sheets(&specs);
    let (answers, polls) = drive(collect_sheets(boxed));
    assert!(answers == [1, 2, 3], "the answers come back in the order of the sheets, whichever sheet finished first");
    let slowest = specs.iter().map(|(waits, _)| *waits).max().unwrap_or(0);
    assert!(
        polls == slowest + 1,
        "collecting takes as many polls as the slowest sheet needs, not the polls of all sheets added up"
    );
    let needed: Vec<u32> = specs.iter().map(|(waits, _)| waits + 1).collect();
    assert!(counts(&counters) == needed, "no sheet is polled more often than it needs");
}
