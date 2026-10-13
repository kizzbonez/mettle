Write the two `async fn` bodies with the standard library only. There is no runtime and no
clock here: time is counted in polls. The starter gives you two finished helpers, `after` and
`drive`, which you do not need to change.

1. `collect_sheets(sheets: Vec<Pin<Box<dyn Future<Output = u32>>>>) -> Vec<u32>` waits for
   every sheet.
   - Each time `collect_sheets` is polled, it polls every sheet that is not finished yet, once.
     All sheets make progress together.
   - A sheet that has answered `Ready` is never polled again.
   - It is ready when every sheet is. Its output holds the answers **in the order of the
     sheets**, whatever order they finished in.
   - With no sheets it is ready at once, with an empty `Vec`.
2. `first_buzz(a: A, b: B) -> A::Output` takes two futures with the same output and gives the
   answer of the one that is ready first.
   - Each time `first_buzz` is polled, it polls `a`. If `a` is ready, that is the answer, and
     `b` is not polled. Otherwise it polls `b`. If `b` is ready, that is the answer.
   - So when both would be ready on the same poll, `a` wins.
   - When `first_buzz` has its answer it returns, and the other future is dropped with it: it
     is cancelled at the `.await` where it last paused, and is never polled again.

In both functions, hand the `cx` you are given on to the futures you poll, so that their
wake-ups reach the executor. `std::future::poll_fn` turns a closure into a future, as in the
lesson.

Example:

```rust
// `after(polls, value)` answers Pending `polls` times and is then ready with `value`.
// `drive(future)` polls a future to its end and returns (output, number of polls).
let sheets: Vec<Pin<Box<dyn Future<Output = u32>>>> =
    vec![Box::pin(after(3, 10)), Box::pin(after(1, 20)), Box::pin(async { 30 })];
drive(collect_sheets(sheets))                  // (vec![10, 20, 30], 4)
                                               // 4 polls: the sheets were waited for together

drive(first_buzz(after(5, 1), after(2, 2)))    // (2, 3): the second future was ready first
drive(first_buzz(after(0, 1), after(0, 2)))    // (1, 1): a tie goes to the first future

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
drive(first_buzz(slow, quick))                 // (2, 2)
notes.borrow()                                 // ["quick team answered"]
```
