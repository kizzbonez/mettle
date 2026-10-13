---
title: Channels and Shared State
summary: Make threads cooperate by sending messages over a channel or by sharing data behind `Arc`, `Mutex`, `RwLock` and atomics, and avoid the deadlocks the compiler cannot catch.
minutes: 30
objectives:
  - Connect threads with an `mpsc` channel and close it so that the receiver stops
  - Share and change data with `Arc<Mutex<T>>` and say exactly when the lock is released
  - Handle a poisoned mutex, and pick between `Mutex`, `RwLock` and an atomic
  - Recognise the common causes of deadlock and apply rules that prevent them
---

## Outline

1. Channels: `std::sync::mpsc`
2. `Arc<Mutex<T>>`: shared state
3. How long a lock is held
4. Poisoning
5. `RwLock` and atomics
6. Deadlocks

## Channels: `std::sync::mpsc`

Threads can cooperate in two ways: hand each other values, or look at the same value. A **channel** does the first. `mpsc` stands for "multiple producer, single consumer": `mpsc::channel()` returns a `Sender<T>`, which can be cloned, and one `Receiver<T>`, which cannot.

- `send(value)` moves the value into the channel and never waits. It fails only if the receiver is gone.
- `recv()` waits for a value. It returns `Err` once **every** sender has been dropped and the queue is empty. `try_recv` and `recv_timeout` do not wait indefinitely.
- Iterating over the receiver calls `recv` until that `Err`.

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    for id in 1..=3u32 {
        let tx = tx.clone();
        thread::spawn(move || {
            let report = (id, format!("{} units", id * 10));
            tx.send(report).unwrap(); // `report` moves into the channel
        });
    }
    drop(tx); // only the workers hold senders now

    let mut reports: Vec<(u32, String)> = rx.iter().collect();
    reports.sort(); // arrival order is up to the scheduler
    println!("{reports:?}");
}
```

```text
[(1, "10 units"), (2, "20 units"), (3, "30 units")]
```

Each worker's clone is dropped when its thread ends, and `drop(tx)` removes the original. Without that line the loop would wait forever for a sender that never sends. Because a sent value is moved, the sender cannot touch it afterwards, so no lock is needed. Each report carries its `id`, so the receiver can restore the order whatever order the reports arrive in.

`channel()` has no size limit. `mpsc::sync_channel(n)` holds at most `n` values, and `send` waits while it is full, which stops a fast producer from filling memory.

## `Arc<Mutex<T>>`: shared state

To look at the same value, threads need two things.

`Arc<T>` is `Rc<T>` with a counter that is updated atomically, so it may cross threads. Like `Rc`, it gives shared access only. It adds no protection to its contents: an `Arc<T>` is `Send` and `Sync` only when `T` is both.

`Mutex<T>` (mutual exclusion) adds the mutation. `lock()` waits until no other thread holds the lock, then returns a **guard** inside a `Result` (the reason for the `unwrap` comes under "Poisoning"). The guard dereferences to the data, and dropping it unlocks. Since only one thread can reach the data at a time, `Mutex<T>` is `Sync` whenever `T` is `Send`. That is what makes the pair work: `Arc<Mutex<T>>` is the thread-safe `Rc<RefCell<T>>`, and it waits where a `RefCell` would panic.

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let queue = Arc::new(Mutex::new(vec![5u64, 4, 3, 2, 1]));
    let total = Arc::new(Mutex::new(0u64));

    let workers: Vec<_> = (0..2)
        .map(|_| {
            let (queue, total) = (Arc::clone(&queue), Arc::clone(&total));
            thread::spawn(move || {
                loop {
                    let next = queue.lock().unwrap().pop(); // guard dropped at the `;`
                    match next {
                        Some(n) => *total.lock().unwrap() += n * n,
                        None => break,
                    }
                }
            })
        })
        .collect();

    for worker in workers {
        worker.join().unwrap();
    }
    println!("{}", total.lock().unwrap());
}
```

```text
55
```

The same wrapping shares things that cannot be cloned. A `Receiver` in an `Arc<Mutex<..>>` lets several workers take turns receiving from one channel.

## How long a lock is held

A guard that is not stored in a variable is a temporary. It is dropped at the end of the statement that created it. But temporaries in the condition of a `while let` or a `match` live until the end of the whole body:

```rust
use std::sync::Mutex;

fn main() {
    let queue = Mutex::new(vec![3, 2, 1]);

    let next = queue.lock().unwrap().pop();
    println!("{next:?}, still locked: {}", queue.try_lock().is_err());

    while let Some(n) = queue.lock().unwrap().pop() {
        println!("{n}, still locked: {}", queue.try_lock().is_err());
    }
}
```

```text
Some(1), still locked: false
2, still locked: true
3, still locked: true
```

`try_lock` returns an error instead of waiting, which makes the difference visible. Workers written with the second form would run one at a time, each holding the lock during its work. Take what you need in a `let` statement, then work unlocked.

## Poisoning

If a thread panics while it holds a guard, the data may be half updated. The mutex becomes **poisoned**, and every later `lock()` returns `Err`.

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let stock = Arc::new(Mutex::new(vec![1, 2, 3]));
    let clone = Arc::clone(&stock);

    let result = thread::spawn(move || {
        let mut guard = clone.lock().unwrap();
        guard.push(4);
        panic!("worker failed mid-update");
    })
    .join();
    println!("worker panicked: {}", result.is_err());

    match stock.lock() {
        Ok(guard) => println!("clean: {guard:?}"),
        Err(poisoned) => println!("poisoned: {:?}", poisoned.into_inner()),
    }
}
```

```text
thread '<unnamed>' (135) panicked at src/main.rs:11:9:
worker failed mid-update
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
worker panicked: true
poisoned: [1, 2, 3, 4]
```

`lock().unwrap()` therefore means "if another thread died while changing this, stop too", which is usually right. `into_inner()` on the error hands you the guard anyway, for the cases where you can repair the data.

## `RwLock` and atomics

`RwLock<T>` allows many readers **or** one writer: `read()` and `write()` each return a guard. It pays off when reads are frequent and writes are rare. An **atomic** such as `AtomicUsize` or `AtomicBool` is a single number or flag that is changed in one indivisible step, with no lock at all.

```rust
use std::sync::RwLock;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

fn main() {
    let hits = AtomicUsize::new(0);
    let config = RwLock::new(String::from("v1"));

    thread::scope(|s| {
        for _ in 0..4 {
            s.spawn(|| {
                for _ in 0..1000 {
                    let length = config.read().unwrap().len(); // readers do not block each other
                    hits.fetch_add(length, Ordering::SeqCst);
                }
            });
        }
    });

    *config.write().unwrap() = String::from("v2.0");
    println!("{} {}", hits.load(Ordering::SeqCst), config.read().unwrap());
}
```

```text
8000 v2.0
```

Atomic methods take `&self`, so no `mut` is needed. The `Ordering` argument says how strictly the operation is ordered against other threads. `SeqCst` is the strictest and the safe default. An atomic protects one value only: a `load` followed by a `store` is two steps, and another thread can run between them. Use `fetch_add` and its relatives, or a `Mutex` when several values must change together.

## Deadlocks

`Send` and `Sync` prevent data races. They do not prevent a **deadlock**, where threads wait for each other forever:

```text
thread 1                      thread 2
lock(accounts)   acquired     lock(audit_log)  acquired
lock(audit_log)  waits        lock(accounts)   waits
```

Other routes to the same result are locking a mutex that the same thread already holds, and waiting on a channel while you still hold one of its senders. Rules that prevent most of them:

- When you need two locks, always take them in the same order everywhere.
- Hold a lock for the shortest time possible, and never across slow work, a `join` or a blocking `send` or `recv`.
- Prefer handing a value over a channel to sharing it.

## Common mistakes

- **Keeping the original `Sender`.** The receiving loop never ends. Drop it, or move it into the last worker.
- **`Rc` or `RefCell` across threads.** The compiler refuses. Use `Arc` and `Mutex`.
- **A guard that lives too long.** `while let ... = m.lock().unwrap().pop()` holds the lock for the whole body.
- **Atomic "check, then act".** `if flag.load(..) { flag.store(..) }` is a race. Use one atomic operation or a mutex.

## Practice

1. Two workers run `while let Some(n) = queue.lock().unwrap().pop() { slow(n); }`. Why is this no faster than one worker, and how do you fix it?
2. Replace `total` in the second example with an atomic. When would an atomic not be enough?
3. `struct Logger { sender: Option<Sender<String>>, worker: Option<JoinHandle<()>> }` owns a thread that prints every line it receives. Implement `Drop` so that the worker prints what was already sent and has finished before `drop` returns. Why are both fields `Option`s?

### Answers

1. The guard lives until the end of the loop body, so `slow(n)` runs while the lock is held. Use `loop { let next = queue.lock().unwrap().pop(); ... }` as in the lesson.
2. Use `Arc<AtomicU64>` and `total.fetch_add(n * n, Ordering::SeqCst)`, then `load` at the end. It is not enough when two pieces of data must stay consistent, such as a balance and its history.
3. Close the channel, then join:

   ```rust
   impl Drop for Logger {
       fn drop(&mut self) {
           drop(self.sender.take()); // closes the channel, so the worker's loop ends
           if let Some(worker) = self.worker.take() {
               worker.join().unwrap();
           }
       }
   }
   ```

   `drop` only gets `&mut self`, but dropping the sender and calling `join` both need ownership. `Option::take` moves the value out and leaves `None`. The queued lines are not lost: the receiver reports the end only after it has delivered them.

## Key takeaways

- A channel moves values between threads and closes when the last `Sender` is dropped.
- `Arc` shares ownership across threads, and `Mutex` allows one thread in at a time.
- A lock is held for as long as its guard lives. Know where that ends.
- A panic while locked poisons the mutex.
- `RwLock` suits many readers, and atomics suit single counters and flags.
- Deadlocks compile. Fixed lock order and short critical sections prevent them.

## Further reading

- [The Rust Programming Language: Transfer Data Between Threads with Message Passing](https://doc.rust-lang.org/book/ch16-02-message-passing.html)
- [The Rust Programming Language: Shared-State Concurrency](https://doc.rust-lang.org/book/ch16-03-shared-state.html)
- [Standard library: `std::sync::Mutex`](https://doc.rust-lang.org/std/sync/struct.Mutex.html)
- [Standard library: `std::sync::atomic`](https://doc.rust-lang.org/std/sync/atomic/index.html)
