//! Drain Before Deploy
//!
//! The lifecycle of one process of a booking service: it takes requests while
//! it runs, stops intake when it is told to shut down, lets the requests in
//! flight finish, and gives up on them only when the deadline passes. Its
//! counters and its gauge are reported as one structured event.

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
        if self.phase != Phase::Running {
            self.rejected += 1;
            return false;
        }
        self.accepted += 1;
        self.in_flight += 1;
        true
    }

    /// A request that was started has finished.
    pub fn end(&mut self) {
        // A request that was abandoned at the deadline may still report its
        // end. By then nothing is in flight, and nothing must change.
        if self.in_flight == 0 {
            return;
        }
        self.in_flight -= 1;
        if self.phase == Phase::Draining && self.in_flight == 0 {
            self.phase = Phase::Stopped;
        }
    }

    /// The request to stop has arrived: stop intake, then drain.
    pub fn shutdown(&mut self) {
        if self.phase != Phase::Running {
            return;
        }
        self.phase = if self.in_flight == 0 { Phase::Stopped } else { Phase::Draining };
    }

    /// The deadline for draining has passed. Returns how many requests were
    /// abandoned by this call.
    pub fn deadline(&mut self) -> u32 {
        if self.phase != Phase::Draining {
            return 0;
        }
        let abandoned = self.in_flight;
        self.abandoned += u64::from(abandoned);
        self.in_flight = 0;
        self.phase = Phase::Stopped;
        abandoned
    }

    /// One structured event: the state as `key=value` fields.
    pub fn status_line(&self) -> String {
        let level = if self.abandoned > 0 { "warn" } else { "info" };
        let phase = match self.phase {
            Phase::Running => "running",
            Phase::Draining => "draining",
            Phase::Stopped => "stopped",
        };
        format!(
            "level={level} phase={phase} in_flight={} accepted={} rejected={} abandoned={}",
            self.in_flight, self.accepted, self.rejected, self.abandoned
        )
    }
}
