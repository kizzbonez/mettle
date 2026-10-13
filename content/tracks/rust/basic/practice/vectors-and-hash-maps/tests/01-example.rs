// Each block calls your functions and compares the results with the example
// in the instructions.
assert_eq!(
    add_minutes(vec![5, 20, 0], 10),
    vec![15, 30, 10],
    "the waiting times 5, 20 and 0 after 10 more minutes"
);

assert_eq!(
    long_waits(&[15, 30, 10, 45], 20),
    vec![30, 45],
    "the waiting times longer than 20 minutes among 15, 30, 10 and 45"
);

let counts = count_by_species(&["dog", "cat", "dog", "parrot"]);
assert_eq!(counts.len(), 3, "the number of different species among dog, cat, dog and parrot");
assert_eq!(counts.get("dog"), Some(&2), "the entry for dog in the map");
assert_eq!(counts.get("cat"), Some(&1), "the entry for cat in the map");

assert_eq!(visits(&counts, "dog"), 2, "the visits of dogs");
assert_eq!(visits(&counts, "rabbit"), 0, "the visits of a species that never came in");
