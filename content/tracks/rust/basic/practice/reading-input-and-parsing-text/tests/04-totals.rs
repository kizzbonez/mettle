fn watering(plant: &str, milliliters: u32) -> Watering {
    Watering { plant: plant.to_string(), milliliters }
}

let waterings = vec![
    watering("basil", 250),
    watering("tomato", 1200),
    watering("basil", 150),
    watering("Tomato", 5),
    watering("basil", 1),
];

assert!(
    total_for(&waterings, "basil") == 401,
    "every watering of the plant is added, wherever it stands in the list"
);
assert!(
    total_for(&waterings, "tomato") == 1200,
    "the plant is compared exactly, so the same name in another case is another plant"
);
assert!(total_for(&waterings, "Tomato") == 5, "a plant that was watered once has that one amount as its total");
assert!(total_for(&waterings, "mint") == 0, "a plant that never appears has a total of 0");
assert!(total_for(&[], "basil") == 0, "an empty list of waterings has a total of 0");

// Names that only look alike are different plants.
let similar = vec![
    watering("basil", 100),
    watering("basil bush", 900),
    watering("sweet basil", 30),
];
assert!(
    total_for(&similar, "basil") == 100,
    "only waterings whose plant matches exactly are counted, not plants whose names merely start or end the same way"
);
assert!(
    total_for(&similar, "basil bush") == 900,
    "a plant with a name of two words is matched as a whole"
);
assert!(
    total_for(&similar, "bush") == 0,
    "a word that is only part of a plant's name matches nothing"
);

// The functions work together.
let parsed = parse_log("fern = 300\n\nfern = 450\nivy = 20\n").expect("this log is valid");
assert!(
    total_for(&parsed, "fern") == 750 && total_for(&parsed, "ivy") == 20,
    "the totals of a log that parse_log has parsed"
);
