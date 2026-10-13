let log = "basil = 250\n\ntomato = 1200\nbasil=150\n";

let waterings = parse_log(log).expect("the sample log is valid");
assert_eq!(
    waterings,
    vec![
        Watering { plant: "basil".to_string(), milliliters: 250 },
        Watering { plant: "tomato".to_string(), milliliters: 1200 },
        Watering { plant: "basil".to_string(), milliliters: 150 },
    ],
    "the waterings parsed from the sample log"
);

assert_eq!(total_for(&waterings, "basil"), 400, "the water that basil received in total");
assert_eq!(total_for(&waterings, "tomato"), 1200, "the water that tomato received in total");

assert_eq!(
    parse_log("basil = 250\n\nmint = a lot\n"),
    Err((3, LogError::BadAmount("a lot".to_string()))),
    "a log whose third line has an amount that is not a number"
);
