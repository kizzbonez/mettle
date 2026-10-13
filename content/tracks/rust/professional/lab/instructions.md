Write `solution.rs` using only the standard library. The public items and their signatures are
in the starter. The private fields of `LruCache` are yours to design; the starter's `Vec` is
only there so that the file compiles.

"Use" below means: the entry becomes the **most recently used**. The entry that has gone
longest without being used is the **least recently used**.

1. `new(capacity)` creates an empty cache that holds at most `capacity` entries. The capacity
   is a `NonZeroUsize`, so a cache of zero entries cannot be asked for.
2. `capacity()`, `len()` and `is_empty()` report the limit and the current number of entries.
3. `get(&key)` returns a reference to the value and uses the entry. `get_mut(&key)` is the
   same with a mutable reference. Each call counts as one **hit** if the key is present and
   one **miss** if it is not.
4. `peek(&key)` returns a reference to the value without using the entry and without
   touching the counters.
5. `put(key, value)` inserts an entry and uses it, in all three cases below. It returns
   whatever left the cache as a result:
   - If the key was already present, its value is replaced and `Some((key, old_value))` is
     returned. Nothing is evicted.
   - Otherwise, if the cache is full, the least recently used entry is removed and returned as
     `Some((its_key, its_value))`. This counts as one **eviction**.
   - Otherwise it returns `None`.
6. `remove(&key)` removes an entry and returns its value, or `None` if the key is absent. It
   is not an eviction and does not touch the counters. The freed space is available to the
   next `put`.
7. `iter()` yields `(&key, &value)` for every entry, from the most recently used to the least
   recently used, without changing anything.
8. `stats()` returns the counters.

`get`, `get_mut`, `peek` and `remove` accept any borrowed form of the key, in the same way as
`HashMap::get`: a cache with `String` keys can be queried with a `&str`.

**Complexity.** `get`, `get_mut`, `peek`, `put` and `remove` must run in O(1) expected time,
independent of the number of entries. A hidden test performs more than a million operations
on a cache of 100,000 entries; a cache that scans or shifts its entries will not finish inside
the time limit of three seconds.

Example, with a capacity of 2:

```rust
use std::num::NonZeroUsize;

let mut cache: LruCache<u64, &str> = LruCache::new(NonZeroUsize::new(2).unwrap());

assert_eq!(cache.put(1, "alpha"), None);
assert_eq!(cache.put(2, "beta"), None);
assert_eq!(cache.get(&1), Some(&"alpha"));              // page 1 is now the most recent
assert_eq!(cache.put(3, "gamma"), Some((2, "beta")));   // full: page 2 is handed back
assert_eq!(cache.get(&2), None);                        // a miss

let order: Vec<(u64, &str)> = cache.iter().map(|(page, text)| (*page, *text)).collect();
assert_eq!(order, vec![(3, "gamma"), (1, "alpha")]);
assert_eq!(cache.stats(), Stats { hits: 1, misses: 1, evictions: 1 });
```

**Tips**

- You do not need `unsafe`. A doubly linked list can live inside a `Vec`, with indices in
  place of pointers, next to a `HashMap` from key to index.
- Decide what happens to a slot when its entry is removed. Leaving holes means tracking free
  slots; closing the hole means another entry moves, and everything that refers to it by index
  must follow.
- `K: Clone` is available: the key may be stored in both the map and the list.
