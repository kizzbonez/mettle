let samples = vec![
    ("/checkout", 120),
    ("/cart", 35),
    ("/checkout", 480),
    ("/login", 90),
    ("/cart", 40),
    ("/checkout", 201),
];

let mean: Rollup<&str, Mean> = samples.iter().copied().collect();
assert_eq!(mean.len(), 3, "number of distinct endpoints");
assert_eq!(
    mean.report(),
    vec![("/cart", 37), ("/checkout", 267), ("/login", 90)],
    "mean latency per endpoint, in endpoint order"
);

// The same result, built one sample at a time.
let mut count: Rollup<&str, Count> = Rollup::new();
for (endpoint, millis) in &samples {
    count.record(*endpoint, *millis);
}
assert_eq!(count.top(2), vec![("/checkout", 3), ("/cart", 2)], "the two busiest endpoints");

let slowest: Rollup<&str, Max> = samples.iter().copied().collect();
assert_eq!(slowest.get(&"/checkout"), Some(480), "slowest /checkout request");
assert_eq!(slowest.get(&"/metrics"), None, "an endpoint with no traffic");
