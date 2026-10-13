Write the body of each function. The `use` line for `HashMap` is already in the starter. Do
not change the signatures.

1. `add_minutes(waits: Vec<u32>, extra: u32) -> Vec<u32>` takes ownership of the waiting
   times, adds `extra` to every one of them and gives the vector back, in the same order. You
   may write `mut` in front of the parameter name.
2. `long_waits(waits: &[u32], limit: u32) -> Vec<u32>` builds a new vector with the waiting
   times that are longer than `limit`, in the order they appear. A time equal to `limit` is
   not longer.
3. `count_by_species(animals: &[&str]) -> HashMap<String, u32>` counts how often each species
   occurs in the list. Each species is a key exactly as it is written, so `dog` and `Dog` are
   two keys. The keys are owned `String` values, which `to_string()` makes from a `&str`.
4. `visits(counts: &HashMap<String, u32>, species: &str) -> u32` looks up one species and
   returns its count, or `0` when the species is not a key.

Example:

```rust
add_minutes(vec![5, 20, 0], 10)             // [15, 30, 10]
long_waits(&[15, 30, 10, 45], 20)           // [30, 45]

let counts = count_by_species(&["dog", "cat", "dog", "parrot"]);
counts.len()                                // 3
counts.get("dog")                           // Some(&2)
counts.get("cat")                           // Some(&1)
visits(&counts, "dog")                      // 2
visits(&counts, "rabbit")                   // 0
```
