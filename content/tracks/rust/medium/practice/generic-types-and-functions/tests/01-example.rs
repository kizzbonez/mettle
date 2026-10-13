// The example from the instructions. The carton starts as a `Carton<&str>`:
// the compiler works that out from the first item packed.
let mut kitchen = Carton::new("kitchen");
kitchen.pack("kettle");
kitchen.pack("toaster");

assert_eq!(kitchen.label(), "kitchen", "the label of a new carton");
assert_eq!(kitchen.items(), ["kettle", "toaster"], "the two items that were packed, in order");
assert_eq!(
    largest(kitchen.items()),
    Some(&"toaster"),
    "the largest of two names, which for text is the last in the alphabet"
);

// Repacking turns it into a `Carton<f64>`, and only that kind has `total_kg`.
let weights = kitchen.repack(vec![1.5, 2.25, 0.5]);
assert_eq!(weights.label(), "kitchen", "the label of the carton after it was repacked");
assert_eq!(weights.total_kg(), 4.25, "the total of the weights 1.5, 2.25 and 0.5");
assert_eq!(largest(weights.items()), Some(&2.25), "the largest of the three weights");

assert_eq!(largest::<u32>(&[]), None, "the largest item of an empty slice");
