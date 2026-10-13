---
title: Threads, Send and Sync
summary: Start threads, get their results back, let them borrow local data safely, and see how two marker traits let the compiler reject data races.
minutes: 30
objectives:
  - Spawn threads, join them and handle a thread that panicked
  - Explain when a thread's closure needs `move` and read the error when it is missing
  - Use `thread::scope` to let threads borrow local variables
  - State what `Send` and `Sync` promise and predict whether a type has them
---

## Outline

1. Spawning and joining
2. `move` closures
3. Scoped threads
4. `Send` and `Sync`
5. How the compiler uses them

## Spawning and joining

A **thread** is an independent line of execution inside one program. Several threads can run at the same moment on different processor cores. Rust's standard library uses the operating system's threads directly: one Rust thread is one OS thread.

`thread::spawn` takes a closure, runs it on a new thread and returns a `JoinHandle<T>` at once. Calling `join()` on the handle waits for the thread to finish and gives back the closure's return value inside a `Result`. The result is `Err` if the thread panicked: a panic ends only the thread it happens on.

```rust
use std::thread;

fn main() {
    let handles: Vec<_> = (1..=3u64)
        .map(|id| thread::spawn(move || (1..=id * 1000).sum::<u64>()))
        .collect();
    for handle in handles {
        println!("{}", handle.join().unwrap());
    }

    let crashed = thread::spawn(|| -> u32 { panic!("sensor offline") });
    println!("join returned Err: {}", crashed.join().is_err());
}
```

```text
500500
2001000
4501500

thread '<unnamed>' (32) panicked at src/main.rs:11:45:
sensor offline
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
join returned Err: true
```

The panic message goes to standard error, and the id in parentheses changes from run to run. The three sums always print in this order because the loop joins the handles in order. The threads themselves may finish in any order. Never rely on the timing of threads you have not joined.

Joining also matters for a second reason: when `main` returns, the process ends and every other thread is stopped wherever it is.

## `move` closures

A spawned thread can outlive the function that started it. So its closure may not borrow that function's local variables:

```rust
use std::thread;

fn main() {
    let samples = vec![3, 9, 4];
    let handle = thread::spawn(|| println!("{}", samples.len()));
    handle.join().unwrap();
}
```

```text
error[E0373]: closure may outlive the current function, but it borrows `samples`, which is owned by the current function
 --> src/main.rs:5:32
  |
5 |     let handle = thread::spawn(|| println!("{}", samples.len()));
  |                                ^^                ------- `samples` is borrowed here
  |                                |
  |                                may outlive borrowed value `samples`
  |
note: function requires argument type to outlive `'static`
 --> src/main.rs:5:18
  |
5 |     let handle = thread::spawn(|| println!("{}", samples.len()));
  |                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
help: to force the closure to take ownership of `samples` (and any other referenced variables), use the `move` keyword
  |
5 |     let handle = thread::spawn(move || println!("{}", samples.len()));
  |                                ++++
```

The note is the key line: `spawn` demands a `'static` closure, meaning one that holds no borrow that could expire. `move` satisfies it by moving `samples` into the closure, so the thread owns the data. After that, `main` can no longer use `samples`. Clone the value first if both sides need it.

## Scoped threads

Often the threads are finished long before the function returns, and moving or cloning is wasted effort. `thread::scope` makes that guarantee visible to the compiler: every thread spawned inside the scope is joined before `scope` returns, so those threads may borrow.

```rust
use std::thread;

fn main() {
    let samples = vec![3, 9, 4, 12, 7];
    let mut peak = 0;
    let (left, right) = samples.split_at(2);

    let total = thread::scope(|s| {
        let a = s.spawn(|| left.iter().sum::<i32>());
        let b = s.spawn(|| right.iter().sum::<i32>());
        s.spawn(|| peak = *samples.iter().max().unwrap());
        a.join().unwrap() + b.join().unwrap()
    });

    println!("total {total}, peak {peak}, {} samples", samples.len());
}
```

```text
total 35, peak 12, 5 samples
```

The ordinary borrow rules still apply across threads. Three threads read `samples` through shared borrows, and exactly one writes `peak` through a mutable borrow. A second thread that also wrote `peak` would be refused with the familiar "cannot borrow as mutable more than once" error. If a scoped thread panics and you did not join it yourself, `scope` panics when it ends.

## `Send` and `Sync`

A **data race** happens when two threads touch the same memory at the same time, at least one of them writes, and nothing coordinates them. The result is undefined behaviour. Rust rules it out with two traits:

- `T: Send` means a value of type `T` may be **moved** to another thread.
- `T: Sync` means a `T` may be **shared** between threads, that is, several threads may hold a `&T` at once. Put precisely: `T` is `Sync` exactly when `&T` is `Send`.

Both are *marker traits*: they have no methods and only label a type. Both are also *auto traits*: the compiler implements them for your struct or enum when every field has them, and leaves them out when one field does not. You write nothing.

| Type | `Send` | `Sync` | Reason |
| --- | --- | --- | --- |
| `i32`, `String`, `Vec<u8>` | yes | yes | no hidden shared state |
| `Rc<T>` | no | no | its counter is updated without synchronization |
| `Cell<T>`, `RefCell<T>` | yes | no | moving one is fine, but two threads sharing one could both mutate it |
| `&T` | if `T: Sync` | if `T: Sync` | a reference is as safe as sharing its target |

## How the compiler uses them

There is no special thread checker. The rules are ordinary trait bounds on the functions that cross threads. This is the signature of `spawn`:

```rust
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
where
    F: FnOnce() -> T + Send + 'static,
    T: Send + 'static,
```

A closure is `Send` only if everything it captured is `Send`. So moving an `Rc` into a thread fails like any unmet trait bound:

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let shared = Rc::new(5);
    let copy = Rc::clone(&shared);
    thread::spawn(move || println!("{copy}")).join().unwrap();
}
```

```text
error[E0277]: `Rc<i32>` cannot be sent between threads safely
 --> src/main.rs:7:19
  |
7 |     thread::spawn(move || println!("{copy}")).join().unwrap();
  |     ------------- -------^^^^^^^^^^^^^^^^^^^
  |     |             |
  |     |             `Rc<i32>` cannot be sent between threads safely
  |     |             within this `{closure@src/main.rs:7:19: 7:26}`
  |     required by a bound introduced by this call
  |
  = help: within `{closure@src/main.rs:7:19: 7:26}`, the trait `Send` is not implemented for `Rc<i32>`
note: required because it's used within this closure
note: required by a bound in `spawn`
```

Read it bottom up: `spawn` has a bound, the closure must meet it, and the closure fails because of the `Rc<i32>` inside it. The thread-safe replacement, `Arc`, is in the next lesson. Scoped threads have the same `Send` bound without `'static`, and a closure that borrows `samples` holds a `&Vec<i32>`, which is `Send` because `Vec<i32>` is `Sync`.

## Common mistakes

- **Not joining.** A thread that is still working when `main` returns is cut off without warning.
- **Adding `move`, then using the value again.** The value now belongs to the thread. Clone it before the closure, or use `thread::scope` and borrow.
- **Assuming an order.** Two threads printing or pushing results interleave differently on every run. Join first, or sort.
- **One thread per item.** Ten thousand inputs must not become ten thousand OS threads. Use a fixed number of workers, as the lab does.

## Practice

1. A program spawns a thread that prints `report ready`, prints `main is done` and returns. Why can the report be missing, and how do you fix it?
2. `let names = vec![..]; let n = thread::spawn(move || names.len()).join().unwrap(); println!("{n} {}", names.len());` does not compile. Give two fixes.
3. Is `struct Cache { hits: u32, shared: Rc<String> }` `Send`? How can you make the compiler tell you?

### Answers

1. `main` may return first, which ends the process. Keep the `JoinHandle` and call `join()` before returning.
2. Clone before moving: `let copy = names.clone();` and use `copy` in the closure. Or borrow in a scope:

   ```rust
   let n = thread::scope(|s| s.spawn(|| names.len()).join().unwrap());
   ```

3. No. One field is not `Send`, so the auto trait is not implemented. Write `fn is_send<T: Send>() {}` and call `is_send::<Cache>();`. The error says `Rc<String>` cannot be sent between threads safely, "within `Cache`".

## Key takeaways

- `spawn` returns a handle, and `join` waits and reports a panic as `Err`.
- A spawned closure must own its data (`move`). A scoped thread may borrow.
- `Send` is about moving a value to another thread. `Sync` is about sharing a reference to it.
- Both traits are derived automatically from a type's fields.
- Thread safety is checked through trait bounds, so a data race is a compile error.

## Further reading

- [The Rust Programming Language: Using Threads to Run Code Simultaneously](https://doc.rust-lang.org/book/ch16-01-threads.html)
- [The Rust Programming Language: Extensible Concurrency with `Send` and `Sync`](https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html)
- [Standard library: `std::thread::scope`](https://doc.rust-lang.org/std/thread/fn.scope.html)
- [Comprehensive Rust: `Send` and `Sync` examples](https://google.github.io/comprehensive-rust/concurrency/send-sync/examples.html)
