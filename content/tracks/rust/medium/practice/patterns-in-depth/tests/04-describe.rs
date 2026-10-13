let city = Trip::City { km: 6 };
let airport = Trip::Airport { terminal: 3, bags: 2 };

// The id 0 comes before everything else.
assert!(
    describe(&Ride { id: 0, trip: city.clone(), tip: None }) == "test ride",
    "a ride with the id 0 is a test ride"
);
assert!(
    describe(&Ride { id: 0, trip: airport.clone(), tip: Some(900) }) == "test ride",
    "the id 0 makes a test ride even of an airport trip with a large tip"
);

// Airport trips come before tips.
assert!(
    describe(&Ride { id: 21, trip: airport.clone(), tip: None }) == "#21 airport, terminal 3",
    "an airport trip names its terminal"
);
assert!(
    describe(&Ride { id: 22, trip: Trip::Airport { terminal: 1, bags: 0 }, tip: Some(900) })
        == "#22 airport, terminal 1",
    "an airport trip is described as one even when it has a generous tip"
);
assert!(
    describe(&Ride { id: 23, trip: Trip::Airport { terminal: 12, bags: 9 }, tip: Some(1) })
        == "#23 airport, terminal 12",
    "the terminal is printed as its number, and the bags are not mentioned"
);

// Tips: 500 cents is where generous starts.
assert!(
    describe(&Ride { id: 5, trip: city.clone(), tip: Some(500) }) == "#5 with a generous tip",
    "a tip of exactly 500 cents is generous"
);
assert!(
    describe(&Ride { id: 5, trip: city.clone(), tip: Some(499) }) == "#5 with a tip",
    "a tip of 499 cents is a tip, and not a generous one"
);
assert!(
    describe(&Ride { id: 6, trip: Trip::Waiting(30), tip: Some(2000) }) == "#6 with a generous tip",
    "a waiting trip can have a generous tip too"
);
assert!(
    describe(&Ride { id: 7, trip: city.clone(), tip: Some(0) }) == "#7 with a tip",
    "a tip of 0 cents is still a tip, because the rule is about having one"
);

// No tip.
assert!(describe(&Ride { id: 1, trip: city.clone(), tip: None }) == "#1", "a city ride without a tip is its number alone");
assert!(
    describe(&Ride { id: 4810, trip: Trip::Waiting(3), tip: None }) == "#4810",
    "a waiting ride without a tip is its number alone, however long the number"
);

// The ride is only borrowed.
let ride = Ride { id: 9, trip: city, tip: Some(120) };
let line = describe(&ride);
assert!(line == "#9 with a tip" && ride.tip == Some(120), "describing a ride leaves the ride as it was");
