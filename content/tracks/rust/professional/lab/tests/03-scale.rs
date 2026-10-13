use std::num::NonZeroUsize;

const CAPACITY: u64 = 100_000;
let entries = CAPACITY as usize;
let mut cache: LruCache<u64, u64> = LruCache::new(NonZeroUsize::new(entries).unwrap());

// Phase 1: insert twice the capacity. The second half pushes the first half
// out in the order it went in.
for page in 0..2 * CAPACITY {
    let displaced = cache.put(page, page * 3);
    let expected = page.checked_sub(CAPACITY).map(|old| (old, old * 3));
    assert!(
        displaced == expected,
        "a put into a full cache evicts the least recently used entry and returns it"
    );
}
assert!(cache.len() == entries, "the cache never holds more entries than its capacity");

// Phase 2: 700,000 lookups in a scattered but repeatable order (xorshift64).
// Pages CAPACITY..2*CAPACITY are cached; anything above is not.
let mut state: u64 = 0x9E37_79B9_7F4A_7C15;
let mut next = move || {
    state ^= state << 13;
    state ^= state >> 7;
    state ^= state << 17;
    state
};
let mut last = 0;
for _ in 0..600_000 {
    let page = CAPACITY + next() % CAPACITY;
    assert!(
        cache.get(&page) == Some(&(page * 3)),
        "a cached entry is found with its value, wherever it sits in the recency order"
    );
    last = page;
}
for _ in 0..100_000 {
    let page = 2 * CAPACITY + next() % CAPACITY;
    assert!(cache.get(&page).is_none(), "a key that was never inserted is a miss");
}
assert!(
    cache.iter().next() == Some((&last, &(last * 3))),
    "the entry used last comes first in iteration order"
);
assert!(
    cache.stats() == Stats { hits: 600_000, misses: 100_000, evictions: CAPACITY },
    "the counters are exact after 700,000 lookups"
);

// Phase 3: use 1,000 pages, then insert CAPACITY - 1,000 new ones. Every other
// page has to be evicted before any of the 1,000.
let kept: Vec<u64> = (0..1_000).map(|i| CAPACITY + i * 97).collect();
let is_kept = |page: u64| {
    (CAPACITY..2 * CAPACITY).contains(&page)
        && (page - CAPACITY) % 97 == 0
        && (page - CAPACITY) / 97 < 1_000
};
for page in &kept {
    assert!(cache.get_mut(page).is_some(), "get_mut finds a cached entry");
}
let fresh = 5 * CAPACITY;
for offset in 0..CAPACITY - 1_000 {
    match cache.put(fresh + offset, offset) {
        Some((page, _)) => assert!(
            !is_kept(page),
            "entries that were just used are evicted only after all the others"
        ),
        None => panic!("a put of a new key into a full cache must evict an entry"),
    }
}
let expected_order = (0..CAPACITY - 1_000)
    .rev()
    .map(|offset| fresh + offset)
    .chain(kept.iter().rev().copied());
assert!(
    cache.iter().map(|(page, _)| *page).eq(expected_order),
    "iteration lists all 100,000 entries from the most to the least recently used"
);
assert!(
    cache.put(9 * CAPACITY, 0) == Some((kept[0], kept[0] * 3)),
    "the entry that has gone longest without use is evicted next"
);

// Phase 4: remove every second new page, then fill the space again.
let evictions = cache.stats().evictions;
let mut removed = 0;
for offset in (0..CAPACITY - 1_000).step_by(2) {
    assert!(
        cache.remove(&(fresh + offset)) == Some(offset),
        "remove finds an entry anywhere in the cache and returns its value"
    );
    removed += 1;
}
assert!(cache.len() == entries - removed, "len reflects every removal");
for i in 0..removed as u64 {
    assert!(
        cache.put(7 * CAPACITY + i, i).is_none(),
        "space freed by remove is reused without evicting anything"
    );
}
assert!(cache.len() == entries, "the cache is full again");
assert!(
    cache.stats().evictions == evictions,
    "remove, and puts into freed space, do not count as evictions"
);
for offset in (1..CAPACITY - 1_000).step_by(2) {
    assert!(
        cache.peek(&(fresh + offset)) == Some(&offset),
        "entries that were not removed keep their values through heavy churn"
    );
}
assert!(
    cache.iter().count() == entries,
    "iteration visits every entry exactly once after heavy churn"
);
assert!(
    cache.put(8 * CAPACITY, 0) == Some((kept[1], kept[1] * 3)),
    "after removals and reuse, the least recently used entry is still the one evicted"
);
