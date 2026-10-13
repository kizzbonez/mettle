---
title: Async Fundamentals
summary: What a future is, what `async` and `.await` compile to, and how polling and waking work, shown with an executor small enough to read in full.
minutes: 30
objectives:
  - Explain why calling an `async fn` runs none of its body
  - Describe what `.await` does when the awaited future is not ready
  - State the contract between `poll`, `Poll::Pending` and the waker
  - Read a minimal `block_on` and explain why it does not spin the processor
---

## Outline

1. Why async exists
2. A future is a value you can poll
3. `async` and `.await`
4. Why an executor is needed
5. Polling and waking
6. A tiny `block_on`

## Why async exists

Threads suit work that keeps a processor busy. Many programs mostly *wait*: for a network reply, a timer, a user. Giving each waiting job its own thread is wasteful, because every thread reserves its own stack (2 MiB by default in the standard library) and the operating system has to switch between them. A server with ten thousand idle connections needs ten thousand small records of "where was I", not ten thousand threads.

Async code provides exactly that. Each job is a small value that can pause at defined points and hand the thread to another job.

## A future is a value you can poll

A **future** is a value that represents a computation which may not have finished yet. The whole interface is one trait in the standard library:

```rust
pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`poll` means "make as much progress as you can without waiting". It returns `Poll::Ready(value)` when the work is done, or `Poll::Pending` when it cannot continue yet. `Pin<&mut Self>` is a mutable reference with one extra promise, that the future will not be moved in memory. The next lesson explains why that matters.

## `async` and `.await`

You rarely write `poll` yourself. An `async fn` does not run when called. It **returns a future**, and the compiler turns the function body into a state machine: a value that stores the local variables and the point where the function last paused.

```rust
async fn greet() -> u32 {
    println!("hello");
    7
}

fn main() {
    greet();
    println!("done");
}
```

```text
warning: unused implementer of `Future` that must be used
 --> src/main.rs:7:5
  |
7 |     greet();
  |     ^^^^^^^
  |
  = note: futures do nothing unless you `.await` or poll them

done
```

`hello` never appears. Futures are **lazy**: nothing happens until somebody polls.

Inside an `async fn` or an `async { }` block you can write `future.await`. It polls the inner future. If the answer is `Ready`, the expression evaluates to the output and the code carries on. If the answer is `Pending`, the *outer* future also returns `Pending` and remembers that it stopped at this `.await`. The next poll resumes from there. So `.await` marks the only places where an async function can pause. Using it outside async code is an error (`E0728`).

## Why an executor is needed

Something must call `poll` on the outermost future, and call it again later. That something is an **executor**. The standard library defines `Future` but ships no executor, so real programs take one from a **runtime** crate such as Tokio. This is also why `main` cannot be async:

```text
error[E0752]: `main` function is not allowed to be `async`
```

Nothing exists yet that could poll the future `main` would return.

## Polling and waking

An executor could poll in a tight loop, but that burns a whole processor while nothing happens. The real design avoids it with a contract:

- `poll` receives a `Context`, which carries a **waker**.
- A future that returns `Pending` must first make sure that `waker.wake()` will be called when it can make progress.
- The executor then sleeps and polls again only after a wake-up.

A future that returns `Pending` and never arranges a wake-up hangs forever. Here is a timer future that keeps the contract. It shares a flag and a slot for the waker with a helper thread.

```rust
use std::future::Future;
use std::pin::{Pin, pin};
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll, Wake, Waker};
use std::thread::{self, Thread};
use std::time::Duration;

#[derive(Default)]
struct Shared {
    done: bool,
    waker: Option<Waker>,
}

/// Becomes ready once `delay` has passed. It never blocks the thread that polls it.
struct Sleep(Arc<Mutex<Shared>>);

fn sleep(delay: Duration) -> Sleep {
    let shared = Arc::new(Mutex::new(Shared::default()));
    let timer = Arc::clone(&shared);
    thread::spawn(move || {
        thread::sleep(delay);
        let mut shared = timer.lock().unwrap();
        shared.done = true;
        if let Some(waker) = shared.waker.take() {
            waker.wake(); // "poll me again"
        }
    });
    Sleep(shared)
}

impl Future for Sleep {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        let mut shared = self.0.lock().unwrap();
        if shared.done {
            return Poll::Ready(());
        }
        shared.waker = Some(cx.waker().clone()); // keep the newest waker
        Poll::Pending
    }
}
```

The mutex makes "check `done`, then store the waker" one step, so a wake-up cannot slip between the two and be lost. A thread per timer keeps the example short. A real runtime watches all timers and sockets from one place.

## A tiny `block_on`

The executor below drives one future to completion on the current thread. Its waker simply unparks that thread. (`thread::park` puts the current thread to sleep, and `unpark` wakes it.)

```rust
// Continues the file above.
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
    let mut polls = 0;
    loop {
        polls += 1;
        match future.as_mut().poll(&mut cx) {
            Poll::Ready(output) => {
                println!("ready after {polls} polls");
                return output;
            }
            Poll::Pending => thread::park(), // sleep until `wake` unparks us
        }
    }
}

async fn fetch(id: u32) -> u32 {
    sleep(Duration::from_millis(20)).await;
    id * 2
}

fn main() {
    let work = async {
        let a = fetch(1).await;
        let b = fetch(2).await;
        a + b
    };
    println!("nothing has run yet");
    println!("{}", block_on(work));
}
```

```text
nothing has run yet
ready after 3 polls
6
```

Three polls, not thousands. The first runs until the first `sleep` returns `Pending`. The timer thread wakes the executor, and the second poll resumes, finishes `fetch(1)` and stops at the second `sleep`. The third poll completes. Between polls the thread is parked and uses no processor time. `park` is allowed to return early, so on rare runs you may see one poll more. An extra poll is harmless, which is why the loop simply polls again.

`pin!` fixes the future in place on the stack so that it can be polled. Implementing the `Wake` trait is the standard library's safe way to build a `Waker`.

## Common mistakes

- **Forgetting `.await`.** The call builds a future and drops it. Heed the "unused implementer of `Future`" warning.
- **Expecting `.await` to run things in parallel.** Two awaits in a row run one after the other, as above. Running futures together is the subject of the next lesson.
- **Returning `Pending` without arranging a wake-up.** The task is never polled again and the program hangs.
- **Polling after `Ready`.** A finished future must not be polled again. Many panic if you do.

## Practice

1. With `greet` from above and this lesson's `block_on`, what does `let f = greet(); println!("a"); block_on(f); println!("b");` print?
2. Write a future `Countdown(u32)` whose `poll` returns `Pending` while the number is above zero, lowering it each time, and then `Ready("liftoff")`. How many polls does `block_on(Countdown(3))` need?
3. In your `Countdown`, what happens if `poll` returns `Pending` without touching the waker?

### Answers

1. `a`, `hello`, `ready after 1 polls`, `b`. The body runs only when `block_on` polls it.
2. Four polls: three `Pending`, then `Ready`.

   ```rust
   struct Countdown(u32);

   impl Future for Countdown {
       type Output = &'static str;

       fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<&'static str> {
           if self.0 == 0 {
               return Poll::Ready("liftoff");
           }
           self.0 -= 1;
           cx.waker().wake_by_ref(); // ask to be polled again
           Poll::Pending
       }
   }
   ```

3. `block_on` parks the thread after the first poll and nothing ever unparks it. The program hangs.

## Key takeaways

- A future is a value. Calling an `async fn` builds it and runs nothing.
- `.await` polls the inner future and pauses the outer one when the answer is `Pending`.
- An executor calls `poll`. The standard library has none, so programs use a runtime.
- `Pending` is a promise that the waker will be called when progress is possible.
- Between wake-ups the executor sleeps, so waiting costs no processor time.

## Further reading

- [The Rust Programming Language: Futures and the Async Syntax](https://doc.rust-lang.org/book/ch17-01-futures-and-syntax.html)
- [Standard library: the `Future` trait](https://doc.rust-lang.org/std/future/trait.Future.html)
- [Standard library: the `Wake` trait](https://doc.rust-lang.org/std/task/trait.Wake.html)
- [Tokio tutorial: Async in depth](https://tokio.rs/tokio/tutorial/async)
