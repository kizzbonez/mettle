//! Drain Before Deploy
//!
//! The lifecycle of one process of a booking service: it takes requests while
//! it runs, stops intake when it is told to shut down, lets the requests in
//! flight finish, and gives up on them only when the deadline passes. Its
//! counters and its gauge are reported as one structured event.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// Where the process is in its life.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Phase {
    /// Taking requests.
    Running,
    /// Told to stop: no new requests, waiting for the ones in flight.
    Draining,
    /// Nothing in flight and nothing accepted any more.
    Stopped,
}

/// The state of the process and the numbers an operator watches.
#[derive(Debug)]
pub struct Lifecycle {
    phase: Phase,
    /// A gauge: requests that have begun and not ended. Goes up and down.
    in_flight: u32,
    /// Counters: they only go up.
    accepted: u64,
    rejected: u64,
    abandoned: u64,
}

impl Lifecycle {
    pub fn new() -> Self {
        Lifecycle { phase: Phase::Running, in_flight: 0, accepted: 0, rejected: 0, abandoned: 0 }
    }

    pub fn phase(&self) -> Phase {
        self.phase
    }

    pub fn in_flight(&self) -> u32 {
        self.in_flight
    }

    /// A request arrives. Returns whether it may start.
    pub fn begin(&mut self) -> bool {
        // TODO 1: accept only while running, and count either way
        todo!("begin")
    }

    /// A request that was started has finished.
    pub fn end(&mut self) {
        // TODO 2: lower the gauge. The last request of a drain stops the process.
        todo!("end")
    }

    /// The request to stop has arrived: stop intake, then drain.
    pub fn shutdown(&mut self) {
        // TODO 3: only a running process reacts. With nothing in flight there
        //         is nothing to wait for.
        todo!("shutdown")
    }

    /// The deadline for draining has passed. Returns how many requests were
    /// abandoned by this call.
    pub fn deadline(&mut self) -> u32 {
        // TODO 4: only a draining process reacts
        todo!("deadline")
    }

    /// One structured event: the state as `key=value` fields.
    pub fn status_line(&self) -> String {
        // TODO 5: level, phase, the gauge and the three counters
        todo!("status_line")
    }
}
