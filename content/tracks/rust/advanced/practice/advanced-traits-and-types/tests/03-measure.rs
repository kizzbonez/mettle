use std::fmt::Debug;

// Works for every implementor of `Measure`, whatever its `Size` is, and
// names that type as `M::Size`.
fn debug_size<M: Measure>(thing: &M) -> String
where
    M::Size: Debug,
{
    format!("{:?}", thing.size())
}

assert!(
    debug_size(&Side(vec![Seconds(187), Seconds(255), Seconds(64)])) == "Seconds(506)",
    "a side is measured in Seconds: the playing times of its tracks added up"
);
assert!(
    debug_size(&Side(Vec::new())) == "Seconds(0)",
    "a side without tracks has a size of zero seconds, and measuring it does not panic"
);
assert!(debug_size(&Side(vec![Seconds(301)])) == "Seconds(301)", "a side with one track is as long as that track");
assert!(
    debug_size(&Side(vec![Seconds(0), Seconds(59), Seconds(0), Seconds(1)])) == "Seconds(60)",
    "every track counts, the first and the last one too"
);

let long_side = Side((1..=40).map(Seconds).collect());
assert!(debug_size(&long_side) == "Seconds(820)", "forty tracks of growing length");
assert!(debug_size(&long_side) == "Seconds(820)", "a side is only borrowed, so it can be measured again");
assert!(long_side.0.len() == 40, "measuring a side leaves its tracks where they are");

// The trait is the same for every implementor, and each one picks its own Size.
struct TrackList(Vec<&'static str>);
impl Measure for TrackList {
    type Size = usize;
    fn size(&self) -> usize {
        self.0.len()
    }
}
assert!(
    debug_size(&TrackList(vec!["Intro", "Road Song", "Outro"])) == "3",
    "another type can implement Measure with a Size of its own"
);
