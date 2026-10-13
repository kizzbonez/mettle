---
title: Threads, Channels, Send and Sync
summary: Run work on several threads, share state or pass messages between them, and see why data races fail to compile.
minutes: 35
objectives:
  - Spawn, scope and join threads, and explain when a closure needs `move`
  - Share state with `Arc<Mutex<T>>` without holding a lock longer than necessary
  - Connect threads with `mpsc` channels and shut a channel down correctly
  - State what `Send` and `Sync` mean and name types that lack them
---

## Outline

1. Spawning and joining
2. Shared state: `Arc<Mutex<T>>`
3. Message passing: channels
4. `Send` and `Sync`

## Spawning and joining

`thread::spawn` runs a closure on a new OS thread and returns a `JoinHandle`. `join()` waits
and returns the closure's result, or an `Err` if the thread panicked. A spawned thread may
outlive the function that started it, so its closure must own what it uses. That is why you
write `move`, and why borrowed locals are rejected.

`thread::scope` lifts that restriction. Every thread spawned in a scope is joined before
`scope` returns, so those threads may borrow local variables.

```rust
use std::thread;

fn main() {
    let readings = vec![3, 9, 4];
    let (low, high) = thread::scope(|s| {
        let low = s.spawn(|| readings.iter().min().copied());   // borrows `readings`
        let high = s.spawn(|| readings.iter().max().copied());
        (low.join().unwrap(), high.join().unwrap())
    });
    assert_eq!((low, high), (Some(3), Some(9)));
}
```

## Shared state: `Arc<Mutex<T>>`

`Arc` gives every thread an owner, and `Mutex` lets one thread in at a time. `lock()` returns a
guard; the lock is released when the guard is dropped. Hold it briefly, and never during slow
work. If a thread panics while holding the lock, the mutex is *poisoned* and later calls to
`lock()` return `Err`.

## Message passing: channels

`mpsc::channel()` returns a `Sender` and a `Receiver`: many producers, one consumer. A `Sender`
can be cloned; the `Receiver` cannot. Iterating over the receiver ends only when **every**
sender has been dropped. Forgetting the original is the classic way to hang a program.

```rust
use std::sync::{mpsc, Arc, Mutex};
use std::thread;

fn main() {
    let done = Arc::new(Mutex::new(0u32));
    let (tx, rx) = mpsc::channel();

    let workers: Vec<_> = (1..=3u32)
        .map(|id| {
            let (done, tx) = (Arc::clone(&done), tx.clone());
            thread::spawn(move || {
                tx.send(id * id).unwrap();
                *done.lock().unwrap() += 1;     // the guard is dropped right here
            })
        })
        .collect();
    drop(tx);                                   // or `rx.iter()` would wait forever

    let mut squares: Vec<u32> = rx.iter().collect();
    squares.sort();                             // arrival order is up to the scheduler
    for worker in workers {
        worker.join().unwrap();
    }
    assert_eq!(squares, [1, 4, 9]);
    assert_eq!(*done.lock().unwrap(), 3);
}
```

## `Send` and `Sync`

Two marker traits carry the thread-safety guarantee.

- `T: Send`: a `T` may be moved to another thread.
- `T: Sync`: a `&T` may be used from several threads at once. In other words, `&T` is `Send`.

The compiler implements both automatically for types made of `Send` and `Sync` parts. `Rc` is
neither, because its counter is not atomic. `RefCell` is not `Sync`, because its borrow flag
is not synchronized. `Mutex<T>` is `Sync` whenever `T` is `Send`, which is how it makes data
shareable. `thread::spawn` requires `Send`, so moving an `Rc` into a thread is a compile error,
not a bug waiting in production.

## Key takeaways

- `spawn` needs owned (`move`) data; `scope` lets threads borrow.
- Share with `Arc<Mutex<T>>` and keep the critical section small.
- A channel closes when its last `Sender` is dropped, and not before.
- `Send` and `Sync` are checked at compile time, so data races do not build.
