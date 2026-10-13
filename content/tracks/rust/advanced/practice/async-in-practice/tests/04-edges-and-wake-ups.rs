use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::task::{Context, Poll, Wake, Waker};

// A waker that counts its calls, to see whether wake-ups reach the executor.
struct Calls(AtomicUsize);
impl Wake for Calls {
    fn wake(self: Arc<Self>) {
        self.0.fetch_add(1, Ordering::SeqCst);
    }
}

fn boxed(sheets: Vec<(u32, u32)>) -> Vec<Pin<Box<dyn Future<Output = u32>>>> {
    let mut all: Vec<Pin<Box<dyn Future<Output = u32>>>> = Vec::new();
    for (polls, value) in sheets {
        all.push(Box::pin(after(polls, value)));
    }
    all
}

// No sheets, one sheet, many sheets.
assert!(
    drive(collect_sheets(Vec::new())) == (Vec::new(), 1),
    "with no sheets, collect_sheets is ready on its first poll with an empty Vec"
);
assert!(drive(collect_sheets(boxed(vec![(0, 42)]))) == (vec![42], 1), "one sheet that is ready at once");
assert!(drive(collect_sheets(boxed(vec![(4, 42)]))) == (vec![42], 5), "one sheet that needs four Pending answers");

let many: Vec<(u32, u32)> = (0..30).map(|team| ((team * 7) % 11, team)).collect();
let expected: Vec<u32> = (0..30).collect();
assert!(
    drive(collect_sheets(boxed(many))) == (expected, 11),
    "thirty sheets that finish in a mixed order: answers in the order of the sheets, in as many polls as the slowest needs"
);

// Wake-ups: each sheet that answers Pending asks for one wake-up through the
// context it was polled with. They must arrive at the waker of the caller.
let calls = Arc::new(Calls(AtomicUsize::new(0)));
let waker = Waker::from(Arc::clone(&calls));
let mut cx = Context::from_waker(&waker);

let mut all = Box::pin(collect_sheets(boxed(vec![(2, 1), (0, 2), (1, 3)])));
assert!(all.as_mut().poll(&mut cx).is_pending(), "collect_sheets with two sheets still out is Pending");
assert!(
    calls.0.load(Ordering::SeqCst) == 2,
    "the two sheets that answered Pending were polled with the caller's context, so their wake-ups arrive"
);
assert!(all.as_mut().poll(&mut cx).is_pending(), "collect_sheets with one sheet still out is Pending");
assert!(calls.0.load(Ordering::SeqCst) == 3, "only the sheet that is still out asks for another wake-up");
assert!(all.as_mut().poll(&mut cx) == Poll::Ready(vec![1, 2, 3]), "collect_sheets is ready with all three answers");

let before = calls.0.load(Ordering::SeqCst);
let mut race = Box::pin(first_buzz(after(3, 1), after(1, 2)));
assert!(race.as_mut().poll(&mut cx).is_pending(), "first_buzz with two unready futures is Pending");
assert!(
    calls.0.load(Ordering::SeqCst) == before + 2,
    "both futures of first_buzz were polled with the caller's context, so their wake-ups arrive"
);
assert!(race.as_mut().poll(&mut cx) == Poll::Ready(2), "first_buzz is ready when its quicker future is");

// The two fit together: a race between teams as one of the sheets, and a
// race against the whole collection.
let sheets: Vec<Pin<Box<dyn Future<Output = u32>>>> = vec![
    Box::pin(first_buzz(after(6, 1), after(2, 2))),
    Box::pin(after(4, 3)),
    Box::pin(first_buzz(after(1, 4), after(1, 5))),
];
assert!(
    drive(collect_sheets(sheets)) == (vec![2, 3, 4], 5),
    "sheets that are races themselves are collected like any other sheet"
);

let total = async { collect_sheets(boxed(vec![(3, 10), (5, 20)])).await.iter().sum::<u32>() };
assert!(
    drive(first_buzz(total, after(9, 0))) == (30, 6),
    "a whole collection can take part in a race, and wins it when it is ready first"
);
let total = async { collect_sheets(boxed(vec![(3, 10), (5, 20)])).await.iter().sum::<u32>() };
assert!(
    drive(first_buzz(total, after(4, 0))) == (0, 5),
    "a collection that is still waiting for a sheet loses the race and is dropped"
);
