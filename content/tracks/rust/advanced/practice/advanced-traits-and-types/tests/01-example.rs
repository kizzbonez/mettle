// The example from the instructions.
assert_eq!(Seconds(187) + Seconds(255), Seconds(442), "two playing times added with +");
assert_eq!(Seconds(90) * 3, Seconds(270), "a playing time of 90 seconds repeated 3 times");
assert_eq!(Seconds(442).to_string(), "7:22", "442 seconds as text, which the starter already does");

// The size is printed in its debug form. That compiles whatever type you
// choose as `Size`, and shows which one you chose.
let side = Side(vec![Seconds(187), Seconds(255), Seconds(64)]);
assert_eq!(
    format!("{:?}", side.size()),
    "Seconds(506)",
    "the size of a side with three tracks, in its debug form"
);

assert_eq!(Seconds(506).spine(), "| 8:26 |", "the spine label of a playing time of 506 seconds");
