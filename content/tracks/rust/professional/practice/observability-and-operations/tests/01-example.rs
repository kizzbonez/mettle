// The two walkthroughs from the instructions.

// A drain that finishes in time.
let mut service = Lifecycle::new();
assert!(service.begin(), "the first request of a running process may start");
assert!(service.begin(), "the second request of a running process may start");
service.end();
assert_eq!(
    service.status_line(),
    "level=info phase=running in_flight=1 accepted=2 rejected=0 abandoned=0",
    "the event after two requests began and one ended"
);

service.shutdown();
assert_eq!(service.phase(), Phase::Draining, "the phase after shutdown with one request in flight");
assert!(!service.begin(), "a request that arrives during the drain may not start");

service.end();
assert_eq!(service.phase(), Phase::Stopped, "the phase after the last request in flight ended");
assert_eq!(
    service.status_line(),
    "level=info phase=stopped in_flight=0 accepted=2 rejected=1 abandoned=0",
    "the event after a drain that finished in time"
);

// A drain that runs into the deadline.
let mut slow = Lifecycle::new();
slow.begin();
slow.begin();
slow.begin();
slow.shutdown();
assert_eq!(slow.deadline(), 3, "the number of requests abandoned at the deadline");
assert_eq!(
    slow.status_line(),
    "level=warn phase=stopped in_flight=0 accepted=3 rejected=0 abandoned=3",
    "the event after the deadline cut the drain short"
);
