assert!(route(&[]) == "no stops", "an empty slice of stops");
assert!(route(&["Central Station"]) == "stay at Central Station", "one stop, with a name of two words");
assert!(route(&["Zoo", "Zoo"]) == "Zoo to Zoo, direct", "two stops, even when they have the same name");
assert!(route(&["Quay", "Mill Lane"]) == "Quay to Mill Lane, direct", "two stops keep their driving order");

assert!(
    route(&["Quay", "Park", "Mill Lane"]) == "Quay to Mill Lane, 1 in between",
    "three stops: the first, the last, and one in between"
);
assert!(
    route(&["Zoo", "Park", "Quay", "Park", "Museum", "Old Town"]) == "Zoo to Old Town, 4 in between",
    "six stops: only the first and the last are named, and the four between them are counted"
);
assert!(
    route(&["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]) == "A to L, 10 in between",
    "twelve stops: the count between the first and the last can have two digits"
);

// The stops can come from a Vec.
let stops = vec!["Depot", "Hospital", "Depot"];
assert!(
    route(&stops) == "Depot to Depot, 1 in between",
    "a round trip counts the stop between the two ends"
);
assert!(stops.len() == 3, "the stops are only borrowed");
