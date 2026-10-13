use std::num::NonZeroUsize;

let mut cache: LruCache<u64, &str> = LruCache::new(NonZeroUsize::new(2).unwrap());
assert_eq!(cache.capacity(), 2, "capacity of the new cache");
assert!(cache.is_empty(), "a new cache is empty");

assert_eq!(cache.put(1, "alpha"), None, "the first insert displaces nothing");
assert_eq!(cache.put(2, "beta"), None, "the second insert displaces nothing");
assert_eq!(cache.len(), 2, "len when the cache is full");

// Page 1 is used, so page 2 becomes the least recently used.
assert_eq!(cache.get(&1), Some(&"alpha"), "page 1 is cached");
assert_eq!(
    cache.put(3, "gamma"),
    Some((2, "beta")),
    "a full cache hands back its least recently used page"
);
assert_eq!(cache.get(&2), None, "the evicted page is gone");
assert_eq!(cache.len(), 2, "len after the eviction");

let order: Vec<(u64, &str)> = cache.iter().map(|(page, text)| (*page, *text)).collect();
assert_eq!(
    order,
    vec![(3, "gamma"), (1, "alpha")],
    "iteration runs from the most to the least recently used page"
);
assert_eq!(
    cache.stats(),
    Stats { hits: 1, misses: 1, evictions: 1 },
    "counters after the walkthrough"
);
