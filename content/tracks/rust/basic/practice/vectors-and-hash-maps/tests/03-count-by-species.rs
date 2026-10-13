let none = count_by_species(&[]);
assert!(none.is_empty(), "an empty list gives an empty map");

let one = count_by_species(&["hamster"]);
assert!(
    one.len() == 1 && one.get("hamster") == Some(&1),
    "a species that occurs once has a count of one"
);

let counts = count_by_species(&["cat", "dog", "cat", "cat", "rabbit", "dog", "cat"]);
assert!(counts.len() == 3, "the map has one key for each different species, however often it occurs");
assert!(
    counts.get("cat") == Some(&4),
    "every occurrence is counted, also when others come in between"
);
assert!(counts.get("dog") == Some(&2), "each species has its own count");
assert!(counts.get("rabbit") == Some(&1), "a species that occurs once among others has a count of one");
assert!(counts.get("parrot") == None, "a species that is not in the list is not a key");

let cases = count_by_species(&["dog", "Dog", "dog ", "dog"]);
assert!(
    cases.len() == 3 && cases.get("dog") == Some(&2) && cases.get("Dog") == Some(&1),
    "a key is the species exactly as written, so another case or an extra space makes another key"
);

let mut total: u32 = 0;
for (_, count) in &counts {
    total += *count;
}
assert!(total == 7, "the counts of all keys add up to the length of the list");
