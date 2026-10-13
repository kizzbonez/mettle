use std::cell::RefCell;
use std::future::Future;
use std::pin::Pin;

// The example from the instructions. `after` and `drive` are the two helpers
// that are already finished in your file.
let sheets: Vec<Pin<Box<dyn Future<Output = u32>>>> =
    vec![Box::pin(after(3, 10)), Box::pin(after(1, 20)), Box::pin(async { 30 })];
assert_eq!(
    drive(collect_sheets(sheets)),
    (vec![10, 20, 30], 4),
    "the answers of three sheets in the order of the sheets, and the number of polls it took to collect them together"
);

assert_eq!(
    drive(first_buzz(after(5, 1), after(2, 2))),
    (2, 3),
    "the answer of the future that was ready first, and the number of polls until then"
);
assert_eq!(
    drive(first_buzz(after(0, 1), after(0, 2))),
    (1, 1),
    "the answer when both futures are ready on the same poll"
);

// The slower team is cancelled: the code after its `.await` never runs.
let notes = RefCell::new(Vec::new());
let slow = async {
    after(9, 0).await;
    notes.borrow_mut().push("slow team answered");
    1
};
let quick = async {
    after(1, 0).await;
    notes.borrow_mut().push("quick team answered");
    2
};
assert_eq!(drive(first_buzz(slow, quick)), (2, 2), "the answer of the quicker of two teams, and the number of polls");
assert_eq!(*notes.borrow(), ["quick team answered"], "what the two teams got to write down");
