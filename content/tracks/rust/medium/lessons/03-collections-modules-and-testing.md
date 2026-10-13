---
title: Collections, Modules and Testing
summary: Pick the right container, keep implementation details private, and prove the code works with unit tests.
minutes: 30
objectives:
  - Choose between `Vec`, `HashMap` and `BTreeMap` for a given task
  - Update a map in place with the entry API
  - Control what a module exports with `pub` and `pub(crate)`
  - Write unit tests that exercise private functions
---

## Outline

1. Choosing a collection
2. The entry API
3. Modules and visibility
4. Unit tests

## Choosing a collection

| Type             | Use it when                             | Iteration order |
| ---------------- | --------------------------------------- | --------------- |
| `Vec<T>`         | you need a growable list (the default)  | insertion       |
| `VecDeque<T>`    | you push and pop at both ends           | front to back   |
| `HashMap<K, V>`  | you look values up by key               | unspecified     |
| `BTreeMap<K, V>` | you need keys in order, or ranges       | sorted by key   |

`HashMap` keys need `Hash + Eq`; `BTreeMap` keys need `Ord`. Never depend on the order in which
a `HashMap` iterates: it is unspecified and can differ from one run to the next. When output
must be stable, use a `BTreeMap` or sort the result.

## The entry API

Counting, grouping and caching all follow one pattern: find the slot for a key, create it if it
is missing, then update it. `entry` does this with a single lookup.

```rust
pub mod inventory {
    use std::collections::BTreeMap;

    /// Counts each word, ignoring case and surrounding spaces.
    pub fn tally(words: &[&str]) -> BTreeMap<String, usize> {
        let mut counts = BTreeMap::new();
        for word in words {
            *counts.entry(normalize(word)).or_insert(0) += 1;
        }
        counts
    }

    // Private: visible in `inventory` and its child modules only.
    fn normalize(word: &str) -> String {
        word.trim().to_lowercase()
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn merges_case_and_whitespace() {
            let counts = tally(&["Bolt", "nut", " bolt "]);
            assert_eq!(counts["bolt"], 2);
            assert_eq!(normalize(" NUT "), "nut");
        }
    }
}

fn main() {
    let counts = inventory::tally(&["nut", "Bolt", "nut"]);
    let keys: Vec<&String> = counts.keys().collect();
    assert_eq!(keys, ["bolt", "nut"]);      // sorted, every time
}
```

`or_insert(0)` returns a `&mut usize` to the new or existing value. `or_default()` does the
same using `Default`, and `or_insert_with` takes a closure for values that are costly to build.

## Modules and visibility

`mod` creates a namespace, and `use` brings a path into scope. Items are **private** by
default: visible in the module that defines them and in its children. `pub` exports an item,
and `pub(crate)` exports it to the rest of the crate but not to users of the library.

Struct fields have their own visibility. A `pub struct` with private fields can be created only
through functions you provide, which is how a type protects its invariants.

## Unit tests

By convention unit tests sit in a child module marked `#[cfg(test)]`, so they are compiled only
by `cargo test`. Because `tests` is a child module, `use super::*;` gives it the private
functions too, as `normalize` shows above. A `#[test]` function passes unless it panics, and
`assert_eq!` prints both values when they differ.

## Key takeaways

- `Vec` by default, `HashMap` for lookup, `BTreeMap` when order matters.
- `entry(key).or_insert(value)` replaces "check, then insert, then look up again".
- Everything is private until you write `pub`; export the smallest surface that works.
- Unit tests live beside the code and can test private items.
