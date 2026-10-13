---
title: Observability and Operations
summary: Make a long-running service explain itself with structured events, spans and metrics, load its configuration safely, shut down without losing work, and survive panics.
minutes: 25
objectives:
  - Distinguish events, spans and metrics and say what question each answers
  - Emit structured events that carry the context of the spans around them
  - Load and validate configuration once at start-up in a way that tests can drive
  - Implement graceful shutdown and choose a policy for panics in worker threads
---

## Outline

1. Three signals
2. Structured events and spans
3. Metrics
4. Configuration
5. Graceful shutdown and panics

## Three signals

Once a service is deployed you cannot attach a debugger to it. **Observability** is being
able to answer "what is it doing, and why?" from what the program emits. There are three
kinds of output:

- An **event** (a log record) says that something happened at one moment.
- A **span** is a period of time with a start and an end, such as one request. Spans nest,
  and the tree of spans for one request is its **trace**.
- A **metric** is a number aggregated over time. A **counter** only goes up (requests
  served), a **gauge** goes up and down (queue length), and a **histogram** records a
  distribution (response times).

## Structured events and spans

A line written for a human, such as `charged 2500 cents for request 41`, has to be taken
apart again with a regular expression. A **structured** event keeps its data in named fields
that a machine can filter and count. Spans add the context for free:

```rust
use std::cell::RefCell;

thread_local! {
    /// The spans this thread is inside, outermost first.
    static SPANS: RefCell<Vec<String>> = const { RefCell::new(Vec::new()) };
}

/// A span covers a period of time. Dropping the guard leaves the span, even
/// on an early return.
struct Span;

fn enter(description: String) -> Span {
    SPANS.with_borrow_mut(|spans| spans.push(description));
    Span
}

impl Drop for Span {
    fn drop(&mut self) {
        SPANS.with_borrow_mut(|spans| spans.pop());
    }
}

/// An event is one moment in time. Its fields are `key=value` pairs.
fn event(level: &str, message: &str) {
    let spans = SPANS.with_borrow(|spans| spans.join(" > "));
    println!("level={level} msg={message:?} spans={spans:?}");
}

fn charge(cents: u64) -> Result<(), &'static str> {
    let _span = enter(format!("charge cents={cents}"));
    if cents > 10_000 {
        event("warn", "amount over limit");
        return Err("over limit");
    }
    event("info", "charged");
    Ok(())
}

fn main() {
    for (request_id, cents) in [(41, 2_500), (42, 99_000)] {
        let _span = enter(format!("request id={request_id}"));
        if charge(cents).is_err() {
            event("error", "request failed");
        }
    }
}
```

```text
level=info msg="charged" spans="request id=41 > charge cents=2500"
level=warn msg="amount over limit" spans="request id=42 > charge cents=99000"
level=error msg="request failed" spans="request id=42"
```

`charge` never mentions the request, yet every line it logs carries the request id, because
the surrounding span supplied it. In real services the `tracing` crate does this job (the
older `log` crate covers events only). Both are **facades**: a library calls the macros, and
the binary installs one subscriber at start-up that decides format and destination. A
library that installs its own takes that decision away from the application. This fragment
needs the crates, so it does not run in the sandbox:

```rust
use tracing::{Level, event, span};

fn handle(request_id: u64, cents: u64) {
    let span = span!(Level::INFO, "request", id = request_id);
    let _enter = span.enter();
    event!(Level::INFO, cents = cents, "charged");
}

fn main() {
    tracing_subscriber::fmt::init(); // in the binary only
    handle(41, 2_500);
}
```

One warning from the `tracing` documentation: in `async` code, do not hold the guard from
`enter` across an `.await`. Attach the span to the future with `.instrument(span)`.

## Metrics

Metrics answer "how many, how often, how slow" without storing every event, which makes them
cheap enough to keep for every request and precise enough to alert on. A counter is an
atomic integer incremented on the hot path. The `Stats` of the lab's cache are counters: the
hit rate, `hits / (hits + misses)`, tells an operator whether the cache is large enough.
Events and spans then explain a single bad request that the numbers pointed to. In a real
service a facade crate such as `metrics` plays the role `tracing` plays for events.

## Configuration

Read configuration once, at start-up, parse it into a typed struct, and refuse to start if
it is wrong. A bad setting found when its code path first runs is an outage at 3 a.m. A bad
setting found at start-up is a failed deploy.

```rust
#[derive(Debug)]
pub struct Config {
    pub port: u16,
    pub workers: usize,
}

impl Config {
    /// `lookup` is `|key| std::env::var(key).ok()` in production and a
    /// closure over fixed values in tests.
    pub fn load(lookup: impl Fn(&str) -> Option<String>) -> Result<Config, String> {
        let port = lookup("APP_PORT").ok_or("APP_PORT is required")?;
        let port = port.parse().map_err(|e| format!("APP_PORT={port:?}: {e}"))?;
        let workers = match lookup("APP_WORKERS") {
            Some(text) => text.parse().map_err(|e| format!("APP_WORKERS={text:?}: {e}"))?,
            None => 4, // the documented default
        };
        Ok(Config { port, workers })
    }
}

fn main() {
    println!("{:?}", Config::load(|key| (key == "APP_PORT").then(|| "8080".to_string())));
    println!("{:?}", Config::load(|key| (key == "APP_PORT").then(|| "80 80".to_string())));
    println!("{:?}", Config::load(|_| None));
}
```

```text
Ok(Config { port: 8080, workers: 4 })
Err("APP_PORT=\"80 80\": invalid digit found in string")
Err("APP_PORT is required")
```

The loader takes a lookup function instead of reading the environment itself. The process
environment is global, so tests that set variables interfere with each other. A closure does
not. Each error names the variable and shows the rejected value. Never do that for secrets.

## Graceful shutdown and panics

A deploy stops the old process with a termination signal. Dying at once loses the work in
progress. **Graceful shutdown** has three steps: notice the request to stop, tell every part
of the program to take no new work, and wait (with a deadline) for work in progress to
finish. The standard library cannot receive signals, so the first step needs a crate or an
async runtime's signal support. The other two are a closed channel and a `join`:

```rust
use std::panic::catch_unwind;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, mpsc};
use std::thread;

static DONE: AtomicU64 = AtomicU64::new(0);
static FAILED: AtomicU64 = AtomicU64::new(0);

fn handle(job: u32) -> u32 {
    assert!(job != 3, "job 3 hit a bug");
    job * 10
}

fn main() {
    // Report every panic in the same format as other events.
    std::panic::set_hook(Box::new(|info| {
        println!("level=error msg={:?}", info.payload_as_str().unwrap_or("panic"));
    }));

    let (sender, receiver) = mpsc::channel::<u32>();
    let receiver = Arc::new(Mutex::new(receiver));
    let workers: Vec<_> = (0..2)
        .map(|_| {
            let receiver = Arc::clone(&receiver);
            thread::spawn(move || {
                loop {
                    // `recv` fails once the sender is gone and the queue is empty.
                    let next = receiver.lock().expect("receiver lock").recv();
                    let Ok(job) = next else { break };
                    // One bad job must not take the worker down with it.
                    match catch_unwind(|| handle(job)) {
                        Ok(_) => DONE.fetch_add(1, Ordering::Relaxed),
                        Err(_) => FAILED.fetch_add(1, Ordering::Relaxed),
                    };
                }
            })
        })
        .collect();

    for job in 1..=5 {
        sender.send(job).expect("workers are running");
    }

    // Shutdown: stop accepting work, let the queue drain, wait for everyone.
    drop(sender);
    for worker in workers {
        worker.join().expect("worker exits cleanly");
    }
    println!("done={} failed={}", DONE.load(Ordering::Relaxed), FAILED.load(Ordering::Relaxed));
}
```

```text
level=error msg="job 3 hit a bug"
done=4 failed=1
```

With the default `panic = "unwind"`, a panic ends only the thread it happens in. There are
three policies, and a service should choose one on purpose:

- **Catch at the unit of work**, as above. The worker survives, and the panic is logged and
  counted. Only do this where a failed job cannot leave shared state half-updated.
- **Let the thread die and supervise it.** `join` returns `Err`, and the supervisor restarts
  the worker or shuts the service down.
- **`panic = "abort"`.** The process dies on the first panic and an external supervisor
  restarts it. No corrupt state survives, but every request in flight is lost.

A panic while a `Mutex` is locked **poisons** it: later `lock()` calls return `Err`, a
warning that the data may be inconsistent.

## Common mistakes

- **`println!` in a library.** The application cannot filter, format or redirect it.
- **Values interpolated into the message** instead of recorded as fields.
- **Reading environment variables where they are used.** Errors surface late and tests
  collide.
- **Secrets in logs**, including through a derived `Debug` on the configuration struct.
- **Shutting down without draining**, or waiting with no deadline.
- **Catching a panic silently.** A caught panic that is not logged and counted is a hidden
  bug.

## Practice

1. Write `hit_rate(hits: u64, misses: u64) -> Option<f64>`. What should it return before the
   first lookup, and why not 0.0?
2. Make `Config::load` reject `APP_WORKERS=0` with a clear message.
3. Remove the `catch_unwind` from the worker loop and call `handle(job)` directly. What
   happens to job 3's thread, to the other jobs, and to `main`?

### Answers

1. `if hits + misses == 0 { None } else { Some(hits as f64 / (hits + misses) as f64) }`.
   With no lookups there is no rate. Reporting 0.0 would look like a cache that always
   misses and could raise a false alarm.
2. After parsing, return `Err("APP_WORKERS must be at least 1".to_string())` when `workers`
   is 0. Validation belongs next to parsing, so the rest of the program only ever sees a
   valid `Config`. A `NonZeroUsize` field would let the type carry the rule.
3. The thread that receives job 3 panics and ends. The other worker keeps receiving, so the
   four remaining jobs are still done. `join` on the dead thread returns `Err`, so the
   `expect` in `main` panics in turn and the process exits with a failure status.

## Key takeaways

- Events say what happened, spans say during what, and metrics say how often.
- Record data as fields, and let spans supply the context.
- Libraries emit through a facade. The binary decides where output goes.
- Validate configuration once at start-up and fail fast.
- Shut down by stopping intake, draining and joining. Choose a panic policy deliberately.

## Further reading

- [Standard library: `std::panic::catch_unwind`](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html)
- [Standard library: `std::panic::set_hook`](https://doc.rust-lang.org/std/panic/fn.set_hook.html)
- [The `tracing` crate](https://docs.rs/tracing/latest/tracing/)
- [Tokio: Graceful shutdown](https://tokio.rs/tokio/topics/shutdown)
