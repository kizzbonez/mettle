Write `solution.rs`. The trait, the type names and every signature are in the starter. The
private fields of `Count`, `Max` and `Mean` are yours to choose.

1. **`Summary`** is the trait every statistic implements. It requires `Default`, and the
   default value is the summary of no samples.
   - `record(&mut self, sample: u64)` adds one sample.
   - `merge(&mut self, other: &Self)` adds every sample that `other` has seen. The result must
     be the same as if all the samples had been recorded into one summary.
   - `value(&self) -> Option<u64>` returns the statistic, or `None` if no sample has been
     recorded.
2. Implement `Summary` for three types.
   - `Count`: the number of samples.
   - `Max`: the largest sample.
   - `Mean`: the arithmetic mean, rounded down to a whole number. Samples can be as large as
     `u64::MAX`, so keep the running total in a wider type.
3. **`Rollup<K, S>`** keeps one summary of type `S` per key of type `K`.
   - `new()` creates an empty roll-up.
   - `record(key, sample)` adds a sample to that key's summary, creating the summary the first
     time the key is seen.
   - `len()` is the number of distinct keys.
   - `get(&key)` is the value for one key, or `None` if the key was never recorded.
   - `report()` lists every key with its value, in ascending key order.
   - `top(n)` lists the `n` keys with the largest values, largest first. Keys with equal values
     appear in ascending key order. If there are fewer than `n` keys, it returns all of them.
   - `merge(&other)` merges another roll-up into this one, key by key, using `Summary::merge`.
     `other` is not modified.
4. Implement `FromIterator<(K, u64)>` for `Rollup<K, S>`, so that a roll-up can be built with
   `.collect()`.

Your `Rollup` must work for any `K: Ord + Clone` and any `S: Summary`, including summaries
written by someone else.

Example:

```rust
let samples = vec![
    ("/checkout", 120),
    ("/cart", 35),
    ("/checkout", 480),
    ("/login", 90),
    ("/cart", 40),
    ("/checkout", 201),
];

let mean: Rollup<&str, Mean> = samples.iter().copied().collect();
assert_eq!(mean.report(), vec![("/cart", 37), ("/checkout", 267), ("/login", 90)]);

let count: Rollup<&str, Count> = samples.iter().copied().collect();
assert_eq!(count.top(2), vec![("/checkout", 3), ("/cart", 2)]);

let slowest: Rollup<&str, Max> = samples.iter().copied().collect();
assert_eq!(slowest.get(&"/checkout"), Some(480));
assert_eq!(slowest.get(&"/metrics"), None);
```

**Tip:** `BTreeMap` iterates in key order, and `sort_by` is a stable sort. Together they give
you the tie-breaking rule of `top` without extra work.
