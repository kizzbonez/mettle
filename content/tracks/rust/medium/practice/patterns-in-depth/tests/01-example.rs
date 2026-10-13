// The example from the instructions.
assert_eq!(fare_cents(&Trip::City { km: 2 }), 600, "the price of a city trip of 2 km");
assert_eq!(fare_cents(&Trip::City { km: 10 }), 1650, "the price of a city trip of 10 km");
assert_eq!(
    fare_cents(&Trip::Airport { terminal: 2, bags: 3 }),
    3800,
    "the price of a trip to terminal 2 with 3 bags"
);
assert_eq!(
    fare_cents(&Trip::Airport { terminal: 5, bags: 0 }),
    4200,
    "the price of a trip to terminal 5 with no bags"
);
assert_eq!(fare_cents(&Trip::Waiting(12)), 350, "the price of waiting for 12 minutes");

assert_eq!(route(&[]), "no stops", "the name of a route with no stops");
assert_eq!(route(&["Mill Lane"]), "stay at Mill Lane", "the name of a route with one stop");
assert_eq!(route(&["Mill Lane", "Quay"]), "Mill Lane to Quay, direct", "the name of a route with two stops");
assert_eq!(
    route(&["Mill Lane", "Park", "Zoo", "Quay"]),
    "Mill Lane to Quay, 2 in between",
    "the name of a route with four stops"
);

assert_eq!(
    describe(&Ride { id: 7, trip: Trip::City { km: 2 }, tip: Some(650) }),
    "#7 with a generous tip",
    "the log line of city ride 7 with a tip of 650 cents"
);
assert_eq!(
    describe(&Ride { id: 8, trip: Trip::Airport { terminal: 2, bags: 1 }, tip: Some(650) }),
    "#8 airport, terminal 2",
    "the log line of airport ride 8 with a tip of 650 cents"
);
