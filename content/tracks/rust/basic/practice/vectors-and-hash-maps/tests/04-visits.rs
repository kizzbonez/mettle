// This map is built by hand, so the test does not depend on count_by_species.
let mut counts = std::collections::HashMap::new();
counts.insert(String::from("cat"), 4);
counts.insert(String::from("dog"), 1);
counts.insert(String::from("iguana"), 0);

assert!(visits(&counts, "cat") == 4, "the count stored for a species that is a key");
assert!(visits(&counts, "dog") == 1, "each key has its own count");
assert!(visits(&counts, "iguana") == 0, "a key whose stored count is 0");
assert!(visits(&counts, "rabbit") == 0, "a species that is not a key answers 0 instead of failing");
assert!(visits(&counts, "") == 0, "an empty name is not a key either");
assert!(
    visits(&counts, "Cat") == 0,
    "the lookup is exact, so a name in another case is not the same key"
);
assert!(
    visits(&counts, "cat") == 4 && counts.len() == 3,
    "looking a species up neither changes the map nor adds a key to it"
);

let empty = std::collections::HashMap::new();
assert!(visits(&empty, "cat") == 0, "an empty map answers 0 for every species");
