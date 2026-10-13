// A deadline only matters during a drain.
let mut running = Lifecycle::new();
running.begin();
running.begin();
assert!(running.deadline() == 0, "a deadline in a running process abandons nothing");
assert!(
    running.phase() == Phase::Running && running.in_flight() == 2,
    "a deadline in a running process changes neither the phase nor the gauge"
);
assert!(running.begin(), "a running process takes requests after a deadline that did not concern it");

// During a drain it abandons what is still in flight.
running.shutdown();
running.end();
assert!(running.phase() == Phase::Draining, "two of three requests are still in flight");
assert!(
    running.deadline() == 2,
    "the deadline returns the number of requests that were in flight when it passed"
);
assert!(running.phase() == Phase::Stopped, "the deadline stops a draining process");
assert!(running.in_flight() == 0, "nothing is in flight after the deadline");
assert!(
    running.status_line() == "level=warn phase=stopped in_flight=0 accepted=3 rejected=0 abandoned=2",
    "abandoned requests are counted, and the event is a warning"
);

// Afterwards nothing moves any more.
assert!(running.deadline() == 0, "a second deadline finds nothing to abandon");
running.end();
running.end();
assert!(
    running.in_flight() == 0 && running.phase() == Phase::Stopped,
    "an abandoned request that still reports its end changes nothing, and does not panic"
);
running.shutdown();
assert!(!running.begin(), "a process stopped by the deadline refuses new requests");
assert!(
    running.status_line() == "level=warn phase=stopped in_flight=0 accepted=3 rejected=1 abandoned=2",
    "the abandoned counter keeps its value: late ends and a second deadline do not change it"
);

// A drain that finished in time has nothing to warn about.
let mut clean = Lifecycle::new();
clean.begin();
clean.shutdown();
assert!(
    clean.status_line() == "level=info phase=draining in_flight=1 accepted=1 rejected=0 abandoned=0",
    "a drain in progress is reported at the info level with its phase in lower case"
);
clean.end();
assert!(clean.deadline() == 0, "a deadline after the drain has finished abandons nothing");
assert!(
    clean.status_line() == "level=info phase=stopped in_flight=0 accepted=1 rejected=0 abandoned=0",
    "a process that drained in time is reported at the info level"
);

// A large drain: the counter takes what the gauge held.
let mut large = Lifecycle::new();
for _ in 0..1000 {
    large.begin();
}
for _ in 0..250 {
    large.end();
}
large.shutdown();
assert!(large.deadline() == 750, "every request still in flight is abandoned at the deadline");
assert!(
    large.status_line() == "level=warn phase=stopped in_flight=0 accepted=1000 rejected=0 abandoned=750",
    "the event after a large drain was cut short"
);
