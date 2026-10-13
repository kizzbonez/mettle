use std::num::NonZeroUsize;
use std::rc::Rc;

fn capacity(entries: usize) -> NonZeroUsize {
    NonZeroUsize::new(entries).expect("a non-zero capacity")
}

// Keys from the most to the least recently used.
fn order<V>(cache: &LruCache<String, V>) -> Vec<String> {
    cache.iter().map(|(key, _)| key.clone()).collect()
}

// A cache keyed by String, queried with &str.
let mut cache: LruCache<String, u32> = LruCache::new(capacity(3));
for (name, value) in [("meta", 1), ("users", 2), ("orders", 3)] {
    assert!(
        cache.put(name.to_string(), value) == None,
        "filling a cache up to its capacity displaces nothing"
    );
}
assert!(
    order(&cache) == ["orders", "users", "meta"],
    "the entry inserted last is the most recently used"
);

// peek: no reordering, no counting.
assert!(cache.peek("meta") == Some(&1), "peek finds a String key through a borrowed &str");
assert!(cache.peek("absent") == None, "peek returns None for an absent key");
assert!(
    order(&cache) == ["orders", "users", "meta"],
    "peek does not change the recency order"
);
assert!(
    cache.stats() == Stats::default(),
    "put and peek count neither hits nor misses"
);

// get_mut: access to the value, promotion, counting.
if let Some(value) = cache.get_mut("meta") {
    *value += 10;
}
assert!(cache.peek("meta") == Some(&11), "get_mut gives mutable access to the stored value");
assert!(
    order(&cache) == ["meta", "orders", "users"],
    "get_mut makes the entry the most recently used"
);
assert!(cache.get_mut("absent").is_none(), "get_mut returns None for an absent key");
assert!(
    cache.stats() == Stats { hits: 1, misses: 1, evictions: 0 },
    "get_mut counts hits and misses in the same way as get"
);

// put on a key that is present: replace, promote, hand back the old value.
assert!(
    cache.put("users".to_string(), 20) == Some(("users".to_string(), 2)),
    "replacing a key returns that key with its previous value"
);
assert!(cache.len() == 3, "replacing a key does not change the length");
assert!(
    order(&cache) == ["users", "meta", "orders"],
    "replacing a key makes it the most recently used"
);
assert!(cache.stats().evictions == 0, "replacing a key is not an eviction");

assert!(
    cache.put("logs".to_string(), 4) == Some(("orders".to_string(), 3)),
    "eviction takes the entry that has gone longest without a get, get_mut or put"
);
assert!(cache.stats().evictions == 1, "pushing out an entry counts as one eviction");

// remove: frees space, is not an eviction, keeps the order of the rest.
assert!(cache.remove("meta") == Some(11), "remove returns the value");
assert!(cache.remove("meta") == None, "removing an absent key returns None");
assert!(cache.len() == 2, "remove shortens the cache");
assert!(order(&cache) == ["logs", "users"], "remove keeps the order of the remaining entries");
assert!(
    cache.put("audit".to_string(), 5) == None,
    "space freed by remove is used before anything is evicted"
);
assert!(
    cache.stats() == Stats { hits: 1, misses: 1, evictions: 1 },
    "remove does not touch the counters"
);

// Removing the two ends of the order must leave a consistent cache behind.
assert!(cache.remove("audit") == Some(5), "the most recently used entry can be removed");
assert!(cache.remove("users") == Some(20), "the least recently used entry can be removed");
assert!(order(&cache) == ["logs"], "one entry is left after removing both ends");
cache.put("a".to_string(), 1);
cache.put("b".to_string(), 2);
assert!(
    order(&cache) == ["b", "a", "logs"],
    "the order is intact after removing the most and the least recently used entries"
);
assert!(
    cache.put("c".to_string(), 3) == Some(("logs".to_string(), 4)),
    "the survivor of the removals is the next entry to be evicted"
);

// The smallest possible cache.
let mut one: LruCache<u8, char> = LruCache::new(capacity(1));
assert!(one.put(1, 'a') == None, "a cache of one entry accepts its first key");
assert!(one.put(2, 'b') == Some((1, 'a')), "a cache of one entry evicts on every new key");
assert!(one.put(2, 'c') == Some((2, 'b')), "a cache of one entry replaces in place on the same key");
assert!(one.get(&2) == Some(&'c'), "the replaced value is the one stored");
assert!(one.remove(&2) == Some('c'), "the only entry can be removed");
assert!(one.is_empty(), "the cache is empty after its only entry is removed");
assert!(one.iter().next().is_none(), "an empty cache iterates over nothing");
assert!(one.put(3, 'd') == None, "an emptied cache accepts a new key without evicting");
assert!(one.get(&3) == Some(&'d'), "an emptied cache works again");

// Ownership: every value is handed back or dropped exactly once.
let token = Rc::new(());
{
    let mut pages: LruCache<u32, Rc<()>> = LruCache::new(capacity(4));
    for page in 0..20 {
        pages.put(page, Rc::clone(&token));
    }
    pages.put(19, Rc::clone(&token));
    pages.remove(&18);
    assert!(pages.len() == 3, "four entries minus one removed");
    assert!(
        Rc::strong_count(&token) == 1 + pages.len(),
        "the cache keeps exactly one value per entry; evicted, replaced and removed values are handed back, not kept"
    );
}
assert!(
    Rc::strong_count(&token) == 1,
    "dropping the cache drops every value it still holds, exactly once"
);
