// The fee is the hours times the hourly rate.
assert!(parking_fee(0) == 0, "the fee for 0 hours");
assert!(parking_fee(1) == 250, "the fee for a single hour, which is the hourly rate itself");
assert!(parking_fee(24) == 6000, "the fee for a whole day of 24 hours");

// Free spaces: take away the arrivals, add the departures.
assert!(
    free_spaces(10, 0, 0) == 10,
    "the free spaces stay as they were when no car arrived and none left"
);
assert!(
    free_spaces(10, 10, 0) == 0,
    "the free spaces after as many cars arrived as there were spaces, and none left"
);
assert!(
    free_spaces(100, 37, 37) == 100,
    "the free spaces are back where they started when every car that arrived has left again"
);
assert!(
    free_spaces(5, 3, 1) == 3,
    "arrivals are subtracted and departures are added, not the other way round"
);
