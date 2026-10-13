assert!(serving_order(&[]).is_empty(), "no arrivals leave an empty queue");

assert!(
    serving_order(&[("kettle", false), ("lamp", false), ("drill", false)]) == ["kettle", "lamp", "drill"],
    "ordinary items are served in the order they arrived"
);
assert!(
    serving_order(&[("kettle", true)]) == ["kettle"],
    "a single urgent item is the whole queue"
);
assert!(
    serving_order(&[("kettle", false), ("lamp", false), ("walker", true)]) == ["walker", "kettle", "lamp"],
    "an urgent item goes ahead of every item that is already waiting"
);
assert!(
    serving_order(&[("walker", true), ("kettle", false), ("lamp", false)]) == ["walker", "kettle", "lamp"],
    "ordinary items that arrive after an urgent one join at the back"
);
assert!(
    serving_order(&[("walker", true), ("hearing aid", true), ("glasses", true)])
        == ["glasses", "hearing aid", "walker"],
    "each urgent item goes to the very front, ahead of the urgent items that came before it"
);
assert!(
    serving_order(&[
        ("kettle", false),
        ("walker", true),
        ("lamp", false),
        ("glasses", true),
        ("drill", false),
    ]) == ["glasses", "walker", "kettle", "lamp", "drill"],
    "urgent and ordinary arrivals can be mixed in any order"
);

// The same thing may be brought in twice.
assert!(
    serving_order(&[("lamp", false), ("lamp", true), ("lamp", false)]) == ["lamp", "lamp", "lamp"],
    "every arrival takes a place in the queue, even when two items have the same name"
);
