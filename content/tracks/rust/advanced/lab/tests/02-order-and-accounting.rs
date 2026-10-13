use std::collections::HashSet;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;

assert!(
    matches!(WorkerPool::new(0), Err(PoolError::NoWorkers)),
    "a pool with zero workers is rejected with PoolError::NoWorkers"
);

let pool = WorkerPool::new(3).expect("a pool of three workers can be created");
assert!(pool.size() == 3, "size() reports the number of workers");

// 240 jobs of very uneven cost, so that they finish in a different order
// from the one they were queued in.
let calls = Arc::new(AtomicUsize::new(0));
let threads = Arc::new(Mutex::new(HashSet::new()));
let inputs: Vec<u64> = (0..240).collect();
let outputs = {
    let calls = Arc::clone(&calls);
    let threads = Arc::clone(&threads);
    pool.map(inputs.clone(), move |n| {
        calls.fetch_add(1, Ordering::SeqCst);
        threads.lock().unwrap().insert(thread::current().id());
        let rounds = if n % 7 == 0 { 30_000 } else { 30 };
        let mut noise = n;
        for round in 0..rounds {
            noise = noise.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(round);
            if round % 5_000 == 0 {
                thread::yield_now();
            }
        }
        std::hint::black_box(noise);
        n * n
    })
};
let expected: Vec<u64> = inputs.iter().map(|n| n * n).collect();
assert!(
    outputs == expected,
    "map returns the outputs in input order, even when jobs finish out of order"
);
assert!(
    calls.load(Ordering::SeqCst) == 240,
    "map calls the function exactly once per input"
);
{
    let seen = threads.lock().unwrap();
    assert!(
        !seen.contains(&thread::current().id()),
        "jobs run on worker threads, never on the thread that called map"
    );
    assert!(
        seen.len() <= 3,
        "no more threads run jobs than the pool has workers"
    );
}

// Edge: nothing to do.
let nothing: Vec<u8> = pool.map(Vec::<u8>::new(), |byte| byte);
assert!(nothing.is_empty(), "mapping an empty input returns an empty output");

// Owned, non-Copy values move through the pool, and the pool can be reused.
let names = vec![String::from("kernel"), String::from("rootfs"), String::from("app")];
let shouted = pool.map(names, |name| name.to_uppercase());
assert!(
    shouted == ["KERNEL", "ROOTFS", "APP"],
    "owned inputs and outputs move through the pool, and a pool can serve several map calls"
);

// submit: fire-and-forget jobs are counted too.
let submitted = Arc::new(AtomicUsize::new(0));
for _ in 0..10 {
    let submitted = Arc::clone(&submitted);
    pool.submit(move || {
        submitted.fetch_add(1, Ordering::SeqCst);
    });
}

let total = pool.shutdown();
assert!(
    submitted.load(Ordering::SeqCst) == 10,
    "every submitted job has run by the time shutdown returns"
);
assert!(
    total == 240 + 3 + 10,
    "shutdown counts one job per closure submitted and one per input mapped"
);
