---
title: Async in Practice
summary: Run futures at the same time, cancel them by dropping them, keep blocking calls out of async code, and understand what `Pin`, streams and a runtime such as Tokio are for.
minutes: 30
objectives:
  - Run two futures concurrently and explain why that is faster than awaiting them in turn
  - Explain cancellation by dropping and name the state a cancelled future can lose
  - Identify blocking calls in async code and move them off the executor thread
  - Say in plain terms what `Pin` guarantees and pin a future with `pin!` or `Box::pin`
---

## Outline

1. Running futures concurrently
2. Cancellation is dropping
3. Never block the executor
4. `Pin` in plain terms
5. Streams
6. What a runtime adds

## Running futures concurrently

`a.await; b.await;` runs `b` only after `a` has finished. To make progress on both, something must poll both. That is all a "join" is: a future that polls its children each time it is polled, and is ready when all of them are.

The examples continue the previous lesson's file. Keep `sleep` and `block_on`, and delete `fetch`, `main` and the three lines that count polls. `poll_fn` turns a closure into a future, which saves writing a struct.

```rust
use std::future::poll_fn;
use std::time::Instant;

async fn join2<A: Future, B: Future>(a: A, b: B) -> (A::Output, B::Output) {
    let (mut a, mut b) = (pin!(a), pin!(b));
    let (mut left, mut right) = (None, None);
    poll_fn(|cx| {
        if left.is_none() {
            if let Poll::Ready(value) = a.as_mut().poll(cx) {
                left = Some(value);
            }
        }
        if right.is_none() {
            if let Poll::Ready(value) = b.as_mut().poll(cx) {
                right = Some(value);
            }
        }
        if left.is_some() && right.is_some() {
            Poll::Ready((left.take().unwrap(), right.take().unwrap()))
        } else {
            Poll::Pending
        }
    })
    .await
}

async fn fetch(id: u32) -> u32 {
    sleep(Duration::from_millis(100)).await;
    id * 2
}

fn main() {
    let start = Instant::now();
    let one_by_one = block_on(async { (fetch(1).await, fetch(2).await) });
    let slow = start.elapsed();

    let start = Instant::now();
    let together = block_on(join2(fetch(1), fetch(2)));
    let fast = start.elapsed();

    println!("{one_by_one:?} {together:?}");
    println!("{} {}", slow >= Duration::from_millis(200), fast < Duration::from_millis(180));
}
```

```text
(2, 4) (2, 4)
true true
```

The joined pair takes about 100 ms, not 200 (on a heavily loaded machine the second `true` could turn `false`). Both timers run while the single thread sleeps. This is **concurrency** on one thread: the futures take turns, and they overlap only in their waiting.

## Cancellation is dropping

A future moves only when it is polled. So cancelling one needs no special signal: stop polling it and drop it. It ends at the `.await` where it last paused, its local variables are dropped as usual, and the code after that point never runs. A timeout is two futures and one rule: whichever is ready first wins.

```rust
struct Cleanup(&'static str);

impl Drop for Cleanup {
    fn drop(&mut self) {
        println!("{}: dropped", self.0);
    }
}

async fn export() -> u32 {
    let _guard = Cleanup("export");
    println!("export: started");
    sleep(Duration::from_millis(300)).await;
    println!("export: finished"); // not reached when cancelled
    7
}

async fn timeout<F: Future>(future: F, limit: Duration) -> Option<F::Output> {
    let mut future = pin!(future);
    let mut timer = pin!(sleep(limit));
    poll_fn(|cx| {
        if let Poll::Ready(value) = future.as_mut().poll(cx) {
            return Poll::Ready(Some(value));
        }
        if timer.as_mut().poll(cx).is_ready() {
            return Poll::Ready(None); // `future` is dropped when `timeout` returns
        }
        Poll::Pending
    })
    .await
}

fn main() {
    let outcome = block_on(timeout(export(), Duration::from_millis(50)));
    println!("{outcome:?}");
}
```

```text
export: started
export: dropped
None
```

Dropping is clean but abrupt. Anything the future held only in local variables is lost: bytes already read into a buffer, an item taken from a queue. An operation that loses nothing when dropped at an `.await` is called **cancel safe**. Library documentation states it for each operation, and the compiler does not check it.

## Never block the executor

The executor gets control back only when a future returns from `poll`, which happens at an `.await` that is `Pending`. Scheduling is **cooperative**. A call that waits *without* awaiting holds the thread, and every other future on it stops: `std::thread::sleep`, a blocking file or network read, a long calculation, waiting for a `std::sync::Mutex` or a `std::sync::mpsc` receiver.

- Use the runtime's async version of the operation.
- Move work that must block, or that computes for a long time, to another thread and await its result.
- Do not hold a `std::sync::MutexGuard` across an `.await`. Lock, change, unlock, then await.

## `Pin` in plain terms

The state machine behind an `async fn` stores its local variables inside itself. If one local borrows another across an `.await`, the future contains a pointer into its own body. Moving the future to a new address would leave that pointer aimed at the old one.

`Pin<P>` wraps a pointer `P` and promises that the value behind it will not move again. `poll` takes `Pin<&mut Self>`, so a future must be pinned before it is polled. Most types do not care about being moved. They implement the auto trait `Unpin`, and for them `Pin` changes nothing. Futures made by `async` are the exception.

`.await` pins for you. You do it yourself when you poll by hand or store futures:

- `pin!(future)` pins on the stack, for use in the current function;
- `Box::pin(future)` pins on the heap and gives a `Pin<Box<..>>` that can be stored or returned.

```rust
fn main() {
    let jobs: Vec<Pin<Box<dyn Future<Output = u32>>>> =
        vec![Box::pin(fetch(1)), Box::pin(async { 40 })];
    let mut sum = 0;
    for job in jobs {
        sum += block_on(job);
    }
    println!("{sum}");
}
```

```text
42
```

Without the pin, the compiler says the future "cannot be unpinned" and suggests `pin!` or `Box::pin`.

## Streams

A future yields one value. A **stream** yields many over time: it is the async counterpart of `Iterator`, with a `poll_next` method that returns `Poll<Option<Item>>`. The standard library's version (`AsyncIterator`) is not stable yet, so the `Stream` trait comes from the `futures` family of crates, and there is no `for` loop for it:

```rust
// Needs the `tokio` and `tokio-stream` crates. It cannot run in the course sandbox.
use tokio_stream::StreamExt;

let mut ticks = tokio_stream::iter(vec![1, 2, 3]);
while let Some(tick) = ticks.next().await {
    println!("{tick}");
}
```

According to the Tokio documentation this prints `1`, `2` and `3`.

## What a runtime adds

Our executor drives one future on one thread, with a thread per timer. A runtime such as **Tokio** replaces each part with something that scales:

- a **scheduler** that runs many independent *tasks* on a pool of worker threads;
- a **reactor** that asks the operating system which sockets and timers are ready, and calls the right wakers;
- async versions of sockets, timers, channels and locks, and helpers for joining, racing and timing out.

```rust
// Needs the `tokio` crate with the "full" feature. It cannot run in the course sandbox.
use std::time::Duration;
use tokio::time::{sleep, timeout};

#[tokio::main]
async fn main() {
    let a = tokio::spawn(async { sleep(Duration::from_millis(50)).await; 1 });
    let b = tokio::spawn(async { sleep(Duration::from_millis(50)).await; 2 });
    println!("{}", a.await.unwrap() + b.await.unwrap());

    let slow = sleep(Duration::from_secs(5));
    println!("{}", timeout(Duration::from_millis(10), slow).await.is_err());

    let sum = tokio::task::spawn_blocking(|| (1..=1_000_000u64).sum::<u64>());
    println!("{}", sum.await.unwrap());
}
```

By the documented behaviour this prints `3`, `true` and `500000500000`. `#[tokio::main]` rewrites `main` into an ordinary function that builds a runtime and calls its `block_on`. `tokio::spawn` starts a task at once and returns a handle to await. A task may resume on a different worker thread, so its future must be `Send + 'static`. `spawn_blocking` runs a closure on a thread where blocking is allowed.

## Common mistakes

- **Awaiting in sequence and expecting concurrency.** Join the futures or spawn tasks.
- **Blocking inside `async`.** One `std::thread::sleep` freezes every task on that thread.
- **Assuming a cancelled future finishes its step.** It stops at an `.await`. Keep state that must survive outside the future.
- **Holding an `Rc` or a lock guard across `.await` in a spawned task.** The future is then not `Send`, and `tokio::spawn` rejects it.

## Practice

1. In `fetch`, replace the awaited `sleep` with `std::thread::sleep(Duration::from_millis(100));`. How long does the joined pair take now, and why?
2. What does the cancellation example print with a limit of 500 ms?
3. Why does a `Vec` of different futures use `Pin<Box<dyn Future<Output = u32>>>` as its element type?

### Answers

1. About 200 ms. Each `fetch` now holds the thread for 100 ms inside `poll` and never returns `Pending`, so `join2` cannot interleave them.
2. `export: started`, `export: finished`, `export: dropped`, `Some(7)`. The export wins the race, and its guard is dropped when the function returns.
3. Every `async` block has its own type, so the elements need a trait object (`dyn Future`). A trait object needs a pointer (`Box`), and a future must be pinned to be polled (`Pin`).

## Key takeaways

- Concurrency means polling several futures in turn. Awaits in sequence do not do that.
- Dropping a future cancels it at its last `.await`.
- Blocking calls stall the whole executor thread. Await, or move the work elsewhere.
- `Pin` keeps a future at one address so that its internal references stay valid.
- A runtime supplies the scheduler, the reactor and the async I/O that the standard library leaves out.

## Further reading

- [The Rust Programming Language: A Closer Look at the Traits for Async](https://doc.rust-lang.org/book/ch17-05-traits-for-async.html)
- [Standard library: `std::pin`](https://doc.rust-lang.org/std/pin/index.html)
- [Tokio tutorial: Select](https://tokio.rs/tokio/tutorial/select)
- [Comprehensive Rust: Cancellation](https://google.github.io/comprehensive-rust/concurrency/async-pitfalls/cancellation.html)
