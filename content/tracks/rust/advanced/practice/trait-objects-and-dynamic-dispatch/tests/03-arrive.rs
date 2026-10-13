// What the booth can find out about an arrival: its label and its toll.
fn seen(kind: &str, axles: u32) -> Option<(String, u32)> {
    arrive(kind, axles).map(|vehicle| (vehicle.label(), vehicle.toll_cents()))
}

assert!(seen("car", 2) == Some((String::from("car"), 250)), "the kind car gives a car");
assert!(
    seen("car", 9) == Some((String::from("car"), 250)),
    "the number of axles is ignored for a car"
);
assert!(
    seen("truck", 3) == Some((String::from("3-axle truck"), 1200)),
    "the kind truck gives a truck with the reported number of axles"
);
assert!(
    seen("truck", 5) == Some((String::from("5-axle truck"), 2000)),
    "a truck built by arrive pays for each of its axles"
);

for unknown in ["tram", "", "Car", "TRUCK", "trucks", " car", "bicycle"] {
    assert!(
        arrive(unknown, 2).is_none(),
        "a kind that is not exactly car or truck gives None"
    );
}

// What arrive returns can go straight into a lane.
let lane: Vec<Box<dyn Vehicle>> =
    [("car", 2), ("lorry", 4), ("truck", 4), ("car", 2)].into_iter().filter_map(|(kind, axles)| arrive(kind, axles)).collect();
assert!(lane.len() == 3, "only the kinds that arrive knows end up in the lane");
assert!(total_toll(&lane) == 2100, "the vehicles built by arrive are charged like any others");
