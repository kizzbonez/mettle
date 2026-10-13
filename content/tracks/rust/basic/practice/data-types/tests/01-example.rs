// Each line calls one of your functions and compares the result with the
// example in the instructions.
assert_eq!(hours_and_minutes(135), (2, 15), "135 minutes as hours and minutes");

assert_eq!(add_rain(10, 20), 30, "10 mm in the gauge plus 20 mm of rain");
assert_eq!(add_rain(250, 10), 255, "250 mm in the gauge plus 10 mm, on a gauge that stops at 255");

// A float is compared with a small tolerance, because it is an approximation.
let average = average_temperature([18, 20, 21]);
println!("average_temperature([18, 20, 21]) returned {average}");
assert!(
    (average - 19.6667).abs() < 0.001,
    "the average of 18, 20 and 21 is 19.666..., with its fraction"
);

assert_eq!(temperature_span((-3.5, 4.0)), 7, "the whole degrees between -3.5 and 4.0");
