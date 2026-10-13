//! Artifact Fingerprint Pool
//!
//! A fixed-size worker pool built from `std::thread` and `std::sync::mpsc`.

use std::thread::JoinHandle;

/// Why a pool could not be created.
#[derive(Debug, PartialEq)]
pub enum PoolError {
    /// A pool needs at least one worker.
    NoWorkers,
}

/// A fixed number of worker threads that take jobs from a shared queue.
pub struct WorkerPool {
    // TODO 1: decide what a pool has to remember. At least: a way to send jobs
    //         to the workers, the handles needed to join them, and a count of
    //         finished jobs that the workers can update.
    workers: Vec<JoinHandle<()>>,
}

impl WorkerPool {
    /// Starts `size` worker threads. `size == 0` is an error.
    pub fn new(size: usize) -> Result<WorkerPool, PoolError> {
        // TODO 2: create the channel, share its receiving end between the
        //         workers, and spawn them
        todo!("WorkerPool::new")
    }

    /// The number of worker threads.
    pub fn size(&self) -> usize {
        todo!("WorkerPool::size")
    }

    /// Queues a job and returns without waiting for it.
    pub fn submit<F>(&self, job: F)
    where
        F: FnOnce() + Send + 'static,
    {
        // TODO 3: box the closure and send it to the workers
        todo!("WorkerPool::submit")
    }

    /// Applies `f` to every input on the pool; outputs are in input order.
    pub fn map<T, R, F>(&self, inputs: Vec<T>, f: F) -> Vec<R>
    where
        T: Send + 'static,
        R: Send + 'static,
        F: Fn(T) -> R + Send + Sync + 'static,
    {
        // TODO 4: submit one job per input, collect the results, and put them
        //         back in input order
        todo!("WorkerPool::map")
    }

    /// Finishes queued jobs, joins the workers and returns the number of jobs run.
    pub fn shutdown(self) -> usize {
        // TODO 5
        todo!("WorkerPool::shutdown")
    }
}

impl Drop for WorkerPool {
    fn drop(&mut self) {
        // TODO 6: a dropped pool must also finish its queue and join its workers
    }
}
