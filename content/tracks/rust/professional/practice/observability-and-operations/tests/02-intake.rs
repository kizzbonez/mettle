let mut service = Lifecycle::new();
assert!(service.phase() == Phase::Running, "a new process is running");
assert!(service.in_flight() == 0, "a new process has nothing in flight");
assert!(
    service.status_line() == "level=info phase=running in_flight=0 accepted=0 rejected=0 abandoned=0",
    "the event of a new process has every number at zero"
);

// Running: every request starts, and the gauge follows.
for expected in 1..=5 {
    assert!(service.begin(), "every request of a running process may start");
    assert!(service.in_flight() == expected, "each accepted request raises the gauge by one");
}
service.end();
service.end();
assert!(service.in_flight() == 3, "each finished request lowers the gauge by one");
assert!(service.begin(), "a running process keeps taking requests after others ended");
assert!(
    service.status_line() == "level=info phase=running in_flight=4 accepted=6 rejected=0 abandoned=0",
    "accepted counts every request that began, also the ones that have ended"
);
assert!(service.phase() == Phase::Running, "requests that begin and end do not change the phase");

// Draining: intake has stopped.
service.shutdown();
for _ in 0..3 {
    assert!(!service.begin(), "a draining process refuses new requests");
}
assert!(service.in_flight() == 4, "a refused request does not touch the gauge");
assert!(
    service.status_line() == "level=info phase=draining in_flight=4 accepted=6 rejected=3 abandoned=0",
    "every refused request is counted, and accepted stays where it was"
);

// Stopped: still refusing, still counting.
for _ in 0..4 {
    service.end();
}
assert!(service.phase() == Phase::Stopped, "the process stops when the drain is complete");
assert!(!service.begin(), "a stopped process refuses new requests");
assert!(!service.begin(), "a stopped process keeps refusing");
assert!(
    service.status_line() == "level=info phase=stopped in_flight=0 accepted=6 rejected=5 abandoned=0",
    "requests refused after the stop are counted like the ones refused during the drain"
);
assert!(service.phase() == Phase::Stopped, "a refused request does not restart a stopped process");
