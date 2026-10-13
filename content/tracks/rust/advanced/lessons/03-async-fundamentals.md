---
title: Async Fundamentals
summary: What a future is, who runs it, how it gets woken and why it must not move, shown with a working executor small enough to read in full.
minutes: 35
objectives:
  - Explain why calling an `async fn` runs none of its body
  - Describe the contract between `poll`, `Poll::Pending` and the waker
  - Read a minimal executor and say what a production runtime adds
  - Explain what `Pin` guarantees and why futures need it
---

## Outline

1. Futures are lazy
2. Polling and wakers
3. A minimal executor
4. Why `Pin` exists
5. Threads or async?

## Futures are lazy

Calling an `async fn` runs none of its body. It returns a **future**: a value that describes
the computation. The compiler turns the body into a state machine that can pause at each
`.await`, and that machine advances only when something polls it.

## Polling and wakers

A future has one method, `poll`. Here is one written by hand:

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct Countdown(u32);

impl Future for Countdown {
    type Output = &'static str;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if self.0 == 0 {
            return Poll::Ready("liftoff");
        }
        self.0 -= 1;
        cx.waker().wake_by_ref();       // ask to be polled again
        Poll::Pending
    }
}
```

`poll` returns `Ready(value)` or `Pending`. Before returning `Pending`, a future must make sure
the **waker** in `cx` will be called when it can make progress: when the socket is readable, or
the timer fires. Nobody polls it again until then, so no thread blocks or spins.

## A minimal executor

An executor polls futures and sleeps until a waker fires. This one drives a single future.

```rust
// Continues the file above.
use std::pin::pin;
use std::sync::Arc;
use std::task::{Wake, Waker};
use std::thread::{self, Thread};

struct Unpark(Thread);

impl Wake for Unpark {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}

fn block_on<F: Future>(future: F) -> F::Output {
    let mut future = pin!(future);
    let waker = Waker::from(Arc::new(Unpark(thread::current())));
    let mut cx = Context::from_waker(&waker);
    loop {
        match future.as_mut().poll(&mut cx) {
            Poll::Ready(output) => return output,
            Poll::Pending => thread::park(),    // sleep until woken
        }
    }
}

async fn launch() -> String {
    let word = Countdown(3).await;      // suspends here while Pending
    format!("{word}!")
}

fn main() {
    let future = launch();              // nothing has run yet
    assert_eq!(block_on(future), "liftoff!");
}
```

A runtime such as Tokio adds many tasks, an I/O reactor, timers and worker threads.

## Why `Pin` exists

The state machine stores its local variables inside itself, and a reference held across an
`.await` points into that same struct. Moving the struct would leave the reference dangling.
`Pin<&mut Self>` is a promise that the future will not move again, which makes such
self-references sound. In practice, `pin!` and `Box::pin` pin a future so that it can be
polled.

## Threads or async?

Threads suit CPU-bound work and a modest number of blocking tasks. Async suits many tasks that
mostly wait, such as ten thousand open connections: each costs a small state machine, not a
thread stack. Never block inside async code, because one blocking call stalls every task that
shares the executor thread.

## Key takeaways

- Calling an `async fn` builds a future; only polling runs it.
- `Pending` means "my waker will be called when I can continue".
- An executor is a loop that polls the futures that were woken.
- `Pin` keeps a future in place so that its internal references stay valid.
