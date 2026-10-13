// Floats are compared with a small tolerance.
fn close(actual: f64, expected: f64) -> bool {
    (actual - expected).abs() < 0.001
}

assert!(
    close(average_temperature([1, 1, 2]), 1.3333),
    "the average keeps its fraction: convert to a float before dividing, not after"
);
assert!(
    close(average_temperature([30, 30, 30]), 30.0),
    "three equal readings average to that reading"
);
assert!(close(average_temperature([0, 0, 0]), 0.0), "three readings of zero average to zero");
assert!(
    close(average_temperature([-4, -5, -5]), -4.6667),
    "readings below zero are averaged like any others"
);
assert!(
    close(average_temperature([-10, 0, 25]), 5.0),
    "all three readings count, whatever their position in the array"
);

assert!(temperature_span((2.0, 8.0)) == 6, "a span of whole degrees");
assert!(
    temperature_span((0.0, 2.75)) == 2,
    "the fraction of the span is dropped, not rounded up"
);
assert!(
    temperature_span((0.5, 2.25)) == 1,
    "the subtraction comes first, and only its result loses the fraction"
);
assert!(temperature_span((1.25, 1.25)) == 0, "a day with one temperature has a span of zero");
assert!(
    temperature_span((-10.5, -0.25)) == 10,
    "the span of a day that stays below zero is still counted from lowest to highest"
);
assert!(
    temperature_span((-1.75, 1.0)) == 2,
    "the lowest temperature is the first part of the tuple and the highest the second"
);
