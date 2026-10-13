// Summaries on their own.
assert!(Count::default().value() == None, "a Count with no samples has no value");
assert!(Max::default().value() == None, "a Max with no samples has no value");
assert!(Mean::default().value() == None, "a Mean with no samples has no value");

let mut max = Max::default();
max.record(0);
assert!(max.value() == Some(0), "a sample of 0 is still a sample: Max reports it");

let mut mean = Mean::default();
for sample in [1, 2, 2] {
    mean.record(sample);
}
assert!(mean.value() == Some(1), "Mean rounds down to a whole number");

let mut huge = Mean::default();
for _ in 0..3 {
    huge.record(u64::MAX);
}
assert!(
    huge.value() == Some(u64::MAX),
    "Mean stays exact when the sum of the samples does not fit in a u64"
);

// An empty roll-up.
let empty: Rollup<String, Count> = Rollup::new();
assert!(empty.len() == 0, "a new roll-up has no keys");
assert!(empty.report().is_empty(), "a new roll-up has an empty report");
assert!(empty.top(5).is_empty(), "top on an empty roll-up returns nothing");
assert!(empty.get(&"/cart".to_string()) == None, "get on an empty roll-up returns None");

// Ranking with ties. Keys are integers here: the container must not assume strings.
let hits = [(40_u32, 7), (10, 1), (30, 9), (20, 9), (10, 6), (50, 9), (60, 2)];
let slowest: Rollup<u32, Max> = hits.iter().copied().collect();

assert!(
    slowest.report() == vec![(10, 6), (20, 9), (30, 9), (40, 7), (50, 9), (60, 2)],
    "report is in ascending key order, whatever order the samples arrived in"
);
assert!(
    slowest.top(4) == vec![(20, 9), (30, 9), (50, 9), (40, 7)],
    "top lists the largest values first and breaks ties by ascending key"
);
assert!(slowest.top(0).is_empty(), "top(0) returns nothing");
assert!(
    slowest.top(100) == vec![(20, 9), (30, 9), (50, 9), (40, 7), (10, 6), (60, 2)],
    "top returns every key when asked for more keys than exist"
);
assert!(slowest.len() == 6, "len counts distinct keys, not samples");

// Tuple keys, built with collect from an owned iterator.
let by_region: Rollup<(String, u16), Count> = vec![
    (("eu".to_string(), 443), 5),
    (("us".to_string(), 80), 5),
    (("eu".to_string(), 443), 5),
    (("eu".to_string(), 80), 5),
]
.into_iter()
.collect();
assert!(
    by_region.report()
        == vec![(("eu".to_string(), 80), 1), (("eu".to_string(), 443), 2), (("us".to_string(), 80), 1)],
    "any key type that is Ord + Clone works, and Count counts samples, not their sum"
);
