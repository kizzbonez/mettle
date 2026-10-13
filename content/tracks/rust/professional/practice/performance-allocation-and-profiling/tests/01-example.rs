// The example from the instructions. Nothing here looks at a clock: the cost
// that is checked is how often your code asks the allocator for memory.
use std::borrow::Cow;

// Three ids: production allocates five times for these.
let ids = [7, 42, 1000];
let mut joined = String::new();
let count = allocations(|| joined = join_ids(&ids));
assert_eq!(joined, "7,42,1000", "three ids joined with commas");
assert!(count <= 1, "join_ids may allocate once for three ids, and it allocated {count} times");

// A SKU that is already clean is borrowed.
let mut clean = Cow::Borrowed("");
let count = allocations(|| clean = clean_sku("AB-12"));
assert_eq!(clean, "AB-12", "a SKU that is already clean");
assert!(matches!(clean, Cow::Borrowed(_)), "a SKU that is already clean is borrowed, not copied");
assert_eq!(count, 0, "the number of allocations for a SKU that is already clean");

// A SKU that needs work is a new string.
let count = allocations(|| clean = clean_sku(" ab-12 "));
assert_eq!(clean, "AB-12", "a SKU with spaces around it and letters in lower case");
assert!(count <= 1, "clean_sku may allocate once for a SKU that changes, and it allocated {count} times");

// One buffer for every line.
let mut line = String::with_capacity(64);
write_line(&mut line, 9001, "AB-12", 3);
assert_eq!(line, "order=9001 sku=AB-12 qty=3", "the first line written into the buffer");
let count = allocations(|| write_line(&mut line, 9002, "ZX-7", 10));
assert_eq!(line, "order=9002 sku=ZX-7 qty=10", "the second line, which replaces the first");
assert_eq!(count, 0, "the number of allocations for a line that fits in the buffer");
