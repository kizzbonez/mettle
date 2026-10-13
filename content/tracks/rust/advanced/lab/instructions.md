Write `solution.rs` using only the standard library. The public items and their signatures are
in the starter. The private fields of `WorkerPool` are yours to choose.

1. `WorkerPool::new(size)` starts exactly `size` worker threads, which wait for jobs. A `size`
   of `0` returns `Err(PoolError::NoWorkers)` and starts nothing.
2. `size()` returns the number of worker threads.
3. `submit(job)` queues a closure and returns immediately, without waiting for it to run.
   - Jobs run on the pool's worker threads, never on the caller's thread.
   - Every job runs exactly once.
   - A worker runs one job at a time, and `size` jobs can be in progress at the same time.
4. `map(inputs, f)` applies `f` to every input on the pool and blocks until all of them are
   done. It returns the outputs **in the order of the inputs**, whatever order the workers
   finish in. An empty input returns an empty `Vec`.
5. `shutdown(self)` stops accepting work, lets every job that is already queued run to
   completion, joins all worker threads, and returns the number of jobs the pool ran in its
   lifetime. Each closure passed to `submit` is one job, and so is each input passed to `map`.
6. Dropping a pool without calling `shutdown` must do the same: queued jobs finish and the
   worker threads are joined before `drop` returns.

Spawn threads only in `new`. You may assume that jobs do not panic.

Example:

```rust
let pool = WorkerPool::new(4).unwrap();

let lengths = pool.map(vec!["bootloader.bin", "kernel.img", "rootfs.squashfs"], |name| name.len());
assert_eq!(lengths, vec![14, 10, 15]);

assert_eq!(pool.shutdown(), 3);
```

**Tips**

- All workers take jobs from one channel, and a `Receiver` cannot be cloned. Think about what
  lets several threads take turns with a single value.
- A worker that still holds the lock while it runs a job makes every other worker wait. Check
  exactly where your lock guard is dropped.
- A receiver sees the end of a channel only when every `Sender` has been dropped. That is both
  how `map` knows it has every result and how a worker knows it is time to exit.
