use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, Barrier};
use std::thread;
use std::time::Duration;

// Used while a pool may hold blocked workers: exit at once instead of
// unwinding into a `drop` that would wait for them.
fn fail(message: &str) -> ! {
    eprintln!("{message}");
    std::process::exit(1);
}

let pool = WorkerPool::new(4).expect("a pool of four workers can be created");

// 1. A job must leave the caller's thread.
let (id_tx, id_rx) = mpsc::channel();
pool.submit(move || {
    let _ = id_tx.send(thread::current().id());
});
match id_rx.recv_timeout(Duration::from_secs(3)) {
    Ok(id) if id != thread::current().id() => {}
    Ok(_) => fail("submit must hand the job to a worker thread, not run it on the caller's thread"),
    Err(_) => fail("a submitted job was never run"),
}

// 2. Four jobs meet at a barrier that opens only when all four are waiting,
//    so they can finish only if four of them are in progress at once.
let barrier = Arc::new(Barrier::new(4));
let (done_tx, done_rx) = mpsc::channel();
for _ in 0..4 {
    let barrier = Arc::clone(&barrier);
    let done_tx = done_tx.clone();
    pool.submit(move || {
        barrier.wait();
        let _ = done_tx.send(());
    });
}
for _ in 0..4 {
    if done_rx.recv_timeout(Duration::from_secs(3)).is_err() {
        fail("a pool of four workers must run four jobs at the same time; no lock may be held while a job runs");
    }
}

// 3. shutdown lets the whole queue drain.
let ran = Arc::new(AtomicUsize::new(0));
for _ in 0..200 {
    let ran = Arc::clone(&ran);
    pool.submit(move || {
        thread::yield_now();
        ran.fetch_add(1, Ordering::SeqCst);
    });
}
let total = pool.shutdown();
assert!(
    ran.load(Ordering::SeqCst) == 200,
    "shutdown returns only after every queued job has run"
);
assert!(
    total == 1 + 4 + 200,
    "shutdown returns the number of jobs run over the pool's lifetime"
);
assert!(
    Arc::strong_count(&ran) == 1,
    "after shutdown no worker thread is left holding a job"
);

// 4. Dropping a pool is as careful as shutting it down.
let ran = Arc::new(AtomicUsize::new(0));
{
    let pool = WorkerPool::new(2).expect("a pool of two workers can be created");
    for _ in 0..100 {
        let ran = Arc::clone(&ran);
        pool.submit(move || {
            thread::yield_now();
            ran.fetch_add(1, Ordering::SeqCst);
        });
    }
}
assert!(
    ran.load(Ordering::SeqCst) == 100,
    "dropping a pool lets every queued job finish before drop returns"
);
assert!(
    Arc::strong_count(&ran) == 1,
    "dropping a pool joins its workers, so none of them still holds a job"
);
