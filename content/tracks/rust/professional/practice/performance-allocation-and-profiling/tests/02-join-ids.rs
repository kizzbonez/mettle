// Results first: a fast wrong answer is still wrong.
assert!(join_ids(&[]) == "", "no ids give an empty string");
assert!(join_ids(&[5]) == "5", "a single id has no comma");
assert!(join_ids(&[0, 0]) == "0,0", "an id of 0 is written like any other");
assert!(
    join_ids(&[1, 22, 333, 4444]) == "1,22,333,4444",
    "ids are separated by commas, with no comma at the start or the end"
);
assert!(join_ids(&[u32::MAX, 1]) == "4294967295,1", "the largest id is written in full");

// A large order with ids of every length.
let mixed: Vec<u32> = (0..2000_u32).map(|n| n.wrapping_mul(2_654_435_761) % 1_000_003).collect();
let expected = join_ids_before(&mixed);
let mut joined = String::new();
let count = allocations(|| joined = join_ids(&mixed));
assert!(joined == expected, "2,000 ids are joined exactly as the version in production joins them");
assert!(
    count <= 1,
    "join_ids may allocate once for 2,000 ids of mixed length, and it allocated {count} times"
);

// The worst case for the size of the result: every id has ten digits.
let longest = vec![u32::MAX; 1000];
let expected = join_ids_before(&longest);
let count = allocations(|| joined = join_ids(&longest));
assert!(joined == expected, "1,000 ids of ten digits are joined exactly as production joins them");
assert!(
    count <= 1,
    "join_ids may allocate once when every id has ten digits, and it allocated {count} times"
);

// The best case: every id has one digit.
let shortest = vec![0_u32; 1000];
let expected = join_ids_before(&shortest);
let count = allocations(|| joined = join_ids(&shortest));
assert!(joined == expected, "1,000 ids of one digit are joined exactly as production joins them");
assert!(
    count <= 1,
    "join_ids may allocate once when every id has one digit, and it allocated {count} times"
);

// No ids.
let count = allocations(|| joined = join_ids(&[]));
assert!(
    joined.is_empty() && count <= 1,
    "join_ids may allocate once at most for no ids, and it allocated {count} times"
);
