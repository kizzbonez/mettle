use std::collections::BTreeMap;

// The example from the instructions.
assert_eq!(
    serving_order(&[
        ("toaster", false),
        ("radio", false),
        ("wheelchair", true),
        ("lamp", false),
        ("glasses", true),
    ]),
    ["glasses", "wheelchair", "toaster", "radio", "lamp"],
    "the queue after three ordinary and two urgent arrivals"
);

assert_eq!(
    first_visits(&["Ada", "Bo", "Ada", "Cy", "Bo"]),
    ["Ada", "Bo", "Cy"],
    "the visitors among five names, two of them repeated"
);

assert_eq!(
    minutes_by_kind(&[("lamp", 20), ("chair", 45), ("lamp", 30), ("kettle", 10)]),
    BTreeMap::from([("chair", 45), ("kettle", 10), ("lamp", 50)]),
    "the total minutes for each kind after two lamps, a chair and a kettle"
);

assert_eq!(
    slowest_first(&[("radio", 20), ("clock", 45), ("lamp", 20), ("chair", 45), ("kettle", 10)]),
    [("clock", 45), ("chair", 45), ("radio", 20), ("lamp", 20), ("kettle", 10)],
    "five repairs sorted by minutes, with two pairs of equally long repairs"
);
