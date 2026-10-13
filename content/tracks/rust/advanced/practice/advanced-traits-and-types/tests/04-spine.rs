use std::fmt;

// Seconds gets the default method through `impl Spine for Seconds {}`.
assert!(Seconds(506).spine() == "| 8:26 |", "the spine label is what Display prints, between | and |, with one space on each side");
assert!(Seconds(0).spine() == "| 0:00 |", "the label of a playing time of zero");
assert!(Seconds(59).spine() == "| 0:59 |", "the label of a playing time under a minute");
assert!(Seconds(2700).spine() == "| 45:00 |", "the label of a whole side of 45 minutes");

// Any other type that implements Display can opt in with an empty impl.
struct Title(String);
impl fmt::Display for Title {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0.to_uppercase())
    }
}
impl Spine for Title {}
assert!(
    Title(String::from("Road Songs")).spine() == "| ROAD SONGS |",
    "the default method uses the Display of whatever type implements Spine"
);
assert!(Title(String::new()).spine() == "|  |", "a text that prints as nothing still gets both bars and both spaces");

struct Year(u32);
impl fmt::Display for Year {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "summer of {}", self.0)
    }
}
impl Spine for Year {}
let year = Year(1994);
assert!(year.spine() == "| summer of 1994 |", "a second type with a Display of its own");
assert!(year.spine() == "| summer of 1994 |", "the value is only borrowed, so its label can be asked for again");

// Through a trait object: `Spine` is dyn compatible.
let labels: Vec<Box<dyn Spine>> = vec![Box::new(Seconds(61)), Box::new(Year(2001))];
let spines: Vec<String> = labels.iter().map(|label| label.spine()).collect();
assert!(
    spines == ["| 1:01 |", "| summer of 2001 |"],
    "the default method works for each type behind a Box<dyn Spine>"
);
