// Nothing in flight: there is nothing to wait for.
let mut idle = Lifecycle::new();
idle.shutdown();
assert!(
    idle.phase() == Phase::Stopped,
    "a process with nothing in flight stops as soon as it is told to shut down"
);

// The same after requests came and went.
let mut quiet = Lifecycle::new();
quiet.begin();
quiet.begin();
quiet.end();
quiet.end();
assert!(
    quiet.phase() == Phase::Running,
    "a running process whose requests have all ended is still running"
);
quiet.shutdown();
assert!(
    quiet.phase() == Phase::Stopped,
    "a process whose requests have all ended stops as soon as it is told to shut down"
);

// Requests in flight: wait for every one of them.
let mut busy = Lifecycle::new();
busy.begin();
busy.begin();
busy.begin();
busy.shutdown();
assert!(busy.phase() == Phase::Draining, "a process with requests in flight drains first");
busy.end();
assert!(busy.phase() == Phase::Draining && busy.in_flight() == 2, "the drain goes on while requests are in flight");
busy.end();
assert!(busy.phase() == Phase::Draining && busy.in_flight() == 1, "one request in flight still holds the drain open");
busy.end();
assert!(busy.phase() == Phase::Stopped && busy.in_flight() == 0, "the last request to end stops the process");

// A second signal changes nothing.
let mut twice = Lifecycle::new();
twice.begin();
twice.shutdown();
twice.shutdown();
assert!(
    twice.phase() == Phase::Draining && twice.in_flight() == 1,
    "a second shutdown during the drain changes nothing"
);
twice.end();
twice.shutdown();
assert!(twice.phase() == Phase::Stopped, "a shutdown after the stop changes nothing");

// An end with nothing in flight is ignored, in every phase.
let mut stray = Lifecycle::new();
stray.end();
assert!(
    stray.phase() == Phase::Running && stray.in_flight() == 0,
    "an end with nothing in flight changes nothing in a running process, and does not panic"
);
assert!(stray.begin(), "a running process still takes requests after a stray end");
stray.shutdown();
stray.end();
stray.end();
assert!(
    stray.phase() == Phase::Stopped && stray.in_flight() == 0,
    "an end with nothing in flight changes nothing in a stopped process, and does not panic"
);
assert!(
    stray.status_line() == "level=info phase=stopped in_flight=0 accepted=1 rejected=0 abandoned=0",
    "stray ends are not counted anywhere"
);
