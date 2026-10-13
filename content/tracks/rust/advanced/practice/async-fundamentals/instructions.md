Write three bodies with the standard library only. The types, `WakeCounter::count` and
`Kettle::new` are complete in the starter. There is no timer and no second thread in this lab:
each `poll` is one look at the kettle.

1. `Wake for WakeCounter`: `wake` adds one to the counter that `count()` reads.
2. `Future for Kettle`, with the output `&'static str`. Each call of `poll` is one look.
   - While looks are left: use one up, ask to be polled again by calling the waker in `cx`
     exactly once, and answer `Poll::Pending`.
   - When no look is left: answer `Poll::Ready("boiling")` and leave the waker alone.

   So `Kettle::new(3)` answers `Pending` three times and is ready on the fourth poll.
3. `drive(future: F) -> Option<(F::Output, u32)>` is a tiny executor.
   - Pin the future, make a `Waker` out of an `Arc<WakeCounter>`, and poll in a loop.
   - When the answer is `Ready(output)`, return `Some((output, polls))`, where `polls` is the
     number of times `drive` called `poll`, the last one included. A finished future is not
     polled again.
   - When the answer is `Pending` and the waker was called during that poll, poll again.
   - When the answer is `Pending` and the waker was **not** called during that poll, return
     `None`. Nothing else is running, so nobody would ever wake this future. A wake-up counts
     only for the poll in which it was asked for.

Example:

```rust
// A waker that counts.
let counter = Arc::new(WakeCounter::default());
let waker = Waker::from(Arc::clone(&counter));
waker.wake_by_ref();
waker.wake_by_ref();
counter.count()                               // 2

// A kettle, polled by hand.
let mut cx = Context::from_waker(&waker);
let mut kettle = pin!(Kettle::new(1));
kettle.as_mut().poll(&mut cx)                 // Poll::Pending
counter.count()                               // 3: the kettle asked for another look
kettle.as_mut().poll(&mut cx)                 // Poll::Ready("boiling")

// The same thing, driven by your executor.
drive(Kettle::new(3))                         // Some(("boiling", 4))
drive(async { Kettle::new(2).await.len() })   // Some((7, 3))
drive(std::future::pending::<u32>())          // None: Pending, and no wake-up was asked for
```

The lesson's `block_on` parks its thread and relies on another thread to call the waker. Here
the futures call the waker themselves before they answer `Pending`, which is why `drive` can
decide on the spot whether another poll makes sense.
