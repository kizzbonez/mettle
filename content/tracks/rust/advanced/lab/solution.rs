//! Artifact Fingerprint Pool: reference solution.

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};

/// Why a pool could not be created.
#[derive(Debug, PartialEq)]
pub enum PoolError {
    /// A pool needs at least one worker.
    NoWorkers,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

/// A fixed number of worker threads that take jobs from a shared queue.
pub struct WorkerPool {
    // `None` once the pool is shutting down. Dropping the only `Sender` is the
    // signal that tells the workers to exit, so it has to be droppable while
    // the rest of the pool is still alive.
    sender: Option<Sender<Job>>,
    workers: Vec<JoinHandle<()>>,
    size: usize,
    completed: Arc<AtomicUsize>,
}

impl WorkerPool {
    /// Starts `size` worker threads. `size == 0` is an error.
    pub fn new(size: usize) -> Result<WorkerPool, PoolError> {
        if size == 0 {
            return Err(PoolError::NoWorkers);
        }
        let (sender, receiver) = mpsc::channel::<Job>();
        // A `Receiver` cannot be cloned, so the workers share one behind a mutex.
        let receiver = Arc::new(Mutex::new(receiver));
        let completed = Arc::new(AtomicUsize::new(0));
        let workers = (0..size)
            .map(|_| {
                let receiver = Arc::clone(&receiver);
                let completed = Arc::clone(&completed);
                thread::spawn(move || work(&receiver, &completed))
            })
            .collect();
        Ok(WorkerPool { sender: Some(sender), workers, size, completed })
    }

    /// The number of worker threads.
    pub fn size(&self) -> usize {
        self.size
    }

    /// Queues a job and returns without waiting for it.
    pub fn submit<F>(&self, job: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let sender = self.sender.as_ref().expect("the sender exists until shutdown");
        // Sending fails only if every worker has exited, which cannot happen
        // while the pool still holds the sender.
        sender.send(Box::new(job)).expect("workers are alive");
    }

    /// Applies `f` to every input on the pool; outputs are in input order.
    pub fn map<T, R, F>(&self, inputs: Vec<T>, f: F) -> Vec<R>
    where
        T: Send + 'static,
        R: Send + 'static,
        F: Fn(T) -> R + Send + Sync + 'static,
    {
        let f = Arc::new(f);
        let (results, collected) = mpsc::channel();
        let mut slots: Vec<Option<R>> = Vec::with_capacity(inputs.len());
        for (index, input) in inputs.into_iter().enumerate() {
            slots.push(None);
            let f = Arc::clone(&f);
            let results = results.clone();
            // Results arrive in completion order, so each one carries the
            // index of the input it belongs to.
            self.submit(move || {
                let _ = results.send((index, f(input)));
            });
        }
        // Only the jobs hold senders now: the loop below ends when the last
        // job has finished. Without this drop it would wait forever.
        drop(results);
        for (index, output) in collected {
            slots[index] = Some(output);
        }
        slots
            .into_iter()
            .map(|slot| slot.expect("every job sends exactly one result"))
            .collect()
    }

    /// Finishes queued jobs, joins the workers and returns the number of jobs run.
    pub fn shutdown(mut self) -> usize {
        self.finish();
        self.completed.load(Ordering::SeqCst)
        // `self` is dropped here; `finish` is safe to run a second time.
    }

    /// Shared by `shutdown` and `drop`.
    fn finish(&mut self) {
        // Closing the channel does not discard what is queued: `recv` keeps
        // returning jobs until the queue is empty and only then reports an error.
        drop(self.sender.take());
        for worker in self.workers.drain(..) {
            // A worker only fails to join if a job panicked; there is nothing
            // useful to do about that here.
            let _ = worker.join();
        }
    }
}

impl Drop for WorkerPool {
    fn drop(&mut self) {
        self.finish();
    }
}

/// The loop every worker thread runs.
fn work(receiver: &Mutex<Receiver<Job>>, completed: &AtomicUsize) {
    loop {
        // The guard returned by `lock` is a temporary that is dropped at the
        // end of this statement, so the lock is released before the job runs.
        // Writing `while let Ok(job) = receiver.lock().unwrap().recv()` would
        // keep it for the whole loop body and make the pool run one job at a time.
        let next = receiver.lock().expect("a worker panicked while waiting").recv();
        match next {
            Ok(job) => {
                job();
                completed.fetch_add(1, Ordering::SeqCst);
            }
            // Every sender is gone and the queue is empty: time to exit.
            Err(_) => break,
        }
    }
}
