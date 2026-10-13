---
title: Collections in Depth
summary: Go beyond `Vec` and `HashMap` with sets, ordered maps and queues, update maps in one step with the entry API, and sort data correctly.
minutes: 30
objectives:
  - Use `HashSet`, `BTreeMap` and `VecDeque` for the jobs they are built for
  - Update a map in place with `entry`, `or_insert`, `or_default` and `and_modify`
  - Sort with `sort`, `sort_by` and `sort_by_key`, and explain what a stable sort guarantees
  - Choose a collection from the operations a task needs
---

## Outline

1. `HashSet`: unique values
2. `BTreeMap`: keys in order
3. `VecDeque`: a queue with two ends
4. The entry API
5. Sorting and removing duplicates
6. Choosing a collection

## `HashSet`: unique values

The Basic level covered `Vec` and `HashMap`. The module `std::collections` has more, each good
at one thing. A `HashSet<T>` stores values with no duplicates and answers "is this in the set?"
quickly. It is a `HashMap` whose values carry no data, so its items need `Hash + Eq`.

```rust
use std::collections::HashSet;

fn main() {
    let mut seen = HashSet::new();
    for tag in ["rust", "cli", "rust", "web"] {
        if !seen.insert(tag) {
            println!("duplicate: {tag}");
        }
    }
    println!("{} {}", seen.len(), seen.contains("cli"));

    let mine = HashSet::from([1, 2, 3]);
    let yours = HashSet::from([2, 3, 4]);
    let mut both: Vec<_> = mine.intersection(&yours).copied().collect();
    both.sort();
    println!("{both:?} {}", mine.is_subset(&yours));
}
```

```text
duplicate: rust
3 true
[2, 3] false
```

`insert` returns `false` when the value was already present, which makes "have I seen this?" a
single call. `intersection`, `union` and `difference` return lazy iterators over references,
hence `copied()` and `collect()`. A `HashSet` iterates in no particular order, so the result is
sorted before printing.

## `BTreeMap`: keys in order

A `BTreeMap<K, V>` offers the same operations as `HashMap`, but keeps its entries sorted by key.
Keys need `Ord` instead of `Hash`. Iteration always runs from the smallest key to the largest,
and the order makes new questions cheap: the first or last entry, or every entry in a range of
keys. A `HashMap` iterates in an unspecified order that can change between runs, so use a
`BTreeMap`, or sort afterwards, whenever output must be stable. `BTreeSet` is the sorted set.

## `VecDeque`: a queue with two ends

Removing the first element of a `Vec` shifts all the others. A `VecDeque<T>` adds and removes
at both ends cheaply. `push_back` with `pop_front` gives a first-in, first-out
queue.

```rust
use std::collections::{BTreeMap, VecDeque};

fn main() {
    let mut stock = BTreeMap::new();
    stock.insert("pear", 4);
    stock.insert("apple", 9);
    stock.insert("fig", 0);

    for (name, count) in &stock {
        print!("{name}={count} ");
    }
    println!("{:?}", stock.first_key_value());
    let b_to_g: Vec<_> = stock.range("b".."g").collect();
    println!("{b_to_g:?}");

    let mut queue = VecDeque::from(["first", "second"]);
    queue.push_back("third");
    queue.push_front("urgent");
    println!("{:?} {:?}", queue.pop_front(), queue.pop_front());
    println!("{queue:?}");
}
```

```text
apple=9 fig=0 pear=4 Some(("apple", 9))
[("fig", 0)]
Some("urgent") Some("first")
["second", "third"]
```

## The entry API

Counting, grouping and "keep the best" all follow one pattern: find the slot for a key, create
it if it is missing, then update it. Doing that with `contains_key`, `insert` and `get_mut`
looks the key up several times. `map.entry(key)` looks once and returns an **entry**, a handle
on the slot whether or not it is filled. Both map types have it.

```rust
use std::collections::BTreeMap;

fn main() {
    let text = "pear apple fig apple pear apple";

    let mut counts: BTreeMap<&str, u32> = BTreeMap::new();
    for word in text.split(' ') {
        *counts.entry(word).or_insert(0) += 1;
    }
    println!("{counts:?}");

    let mut by_length: BTreeMap<usize, Vec<&str>> = BTreeMap::new();
    for word in ["pear", "fig", "plum"] {
        by_length.entry(word.len()).or_default().push(word);
    }
    println!("{by_length:?}");

    let mut best: BTreeMap<&str, u32> = BTreeMap::new();
    for (player, score) in [("ada", 7), ("bo", 3), ("ada", 9)] {
        best.entry(player)
            .and_modify(|top| *top = (*top).max(score))
            .or_insert(score);
    }
    println!("{best:?}");
}
```

```text
{"apple": 3, "fig": 1, "pear": 2}
{3: ["fig"], 4: ["pear", "plum"]}
{"ada": 9, "bo": 3}
```

- `or_insert(value)` inserts `value` if the key is new. Either way it returns `&mut V`, a
  mutable reference to the value in the map, which is why `*... += 1` works.
- `or_default()` does the same with `V::default()`: `0`, an empty `Vec`, and so on. It works
  for any value type that implements `Default`.
- `or_insert_with(closure)` builds the value only when needed, for values that are costly.
- `and_modify(closure)` changes a value that is already there, before the `or_...` call
  handles the missing case.

## Sorting and removing duplicates

```rust
fn main() {
    let mut nums = vec![3, 1, 3, 2, 1];
    nums.sort();
    nums.dedup();
    println!("{nums:?}");

    let mut staff = vec![("bo", 41), ("ada", 36), ("cy", 41), ("di", 29)];
    staff.sort_by_key(|(_, age)| *age);  // smallest age first
    println!("{staff:?}");
    staff.sort_by(|a, b| b.1.cmp(&a.1)); // largest age first
    staff.truncate(3);
    println!("{staff:?}");

    let mut prices: Vec<f64> = vec![2.5, 0.75, 1.0];
    prices.sort_by(|a, b| a.total_cmp(b));
    println!("{prices:?}");
}
```

```text
[1, 2, 3]
[("di", 29), ("ada", 36), ("bo", 41), ("cy", 41)]
[("bo", 41), ("cy", 41), ("ada", 36)]
[0.75, 1.0, 2.5]
```

- `sort()` needs `Ord` items. `sort_by_key` sorts by a value computed from each item.
  `sort_by` takes a closure that compares two items and returns an `Ordering` (`Less`, `Equal`
  or `Greater`), usually by calling `cmp`. Swapping the two sides, `b.cmp(a)`, reverses the
  order.
- All three are **stable**: items that compare as equal keep their earlier order. That is why
  `bo` stays ahead of `cy` in both results, and it lets you sort by one key and then by
  another. `sort_unstable` may reorder equal items; in exchange it allocates no extra memory
  and is generally faster.
- `dedup()` removes *consecutive* repeats only. Sort first to remove every duplicate.
- `truncate(n)` keeps the first `n` items.
- `f64` is not `Ord`, because `NaN` has no place in the order, so `prices.sort()` does not
  compile. `total_cmp` supplies a total order for floats.

## Choosing a collection

| You need | Use |
| --- | --- |
| a growable list, or a stack | `Vec` |
| a queue, or pushing and popping at both ends | `VecDeque` |
| lookup by key, order irrelevant | `HashMap` |
| keys in order, ranges, the smallest or largest key | `BTreeMap` |
| membership tests or unique values | `HashSet`, or `BTreeSet` if sorted |

When in doubt, start with `Vec` or `HashMap`. The standard library's own documentation says
these two cover most needs, and that the others are for specific cases.

## Common mistakes

- **Relying on `HashMap` or `HashSet` order.** It is unspecified, and a test that depends on it
  can fail on the next run.
- **Calling `dedup` on unsorted data.** `[3, 1, 3]` is unchanged, since no repeats are adjacent.
- **Checking, then inserting.** `if !map.contains_key(&k) { map.insert(k, v); }` looks the key
  up twice. Use `entry`.
- **Using your own type as a key without the traits.** A `HashMap` key must derive
  `Hash, PartialEq, Eq`; a `BTreeMap` key must derive `PartialEq, Eq, PartialOrd, Ord`.
- **Removing from the front of a `Vec` in a loop.** Use a `VecDeque`.

## Practice

1. Count how often each character occurs in `"banana"`, with the characters in alphabetical
   order.
2. Sort `vec![("pear", 3), ("fig", 3), ("kiwi", 5)]` so that the largest number comes first.
   Which of the two 3s comes first, and why?
3. Which collection suits a list of jobs that are handled in arrival order?

### Answers

1. `let mut counts = BTreeMap::new();` then
   `for c in "banana".chars() { *counts.entry(c).or_insert(0) += 1; }`. Printing with `{:?}`
   shows `{'a': 3, 'b': 1, 'n': 2}`.
2. `v.sort_by(|a, b| b.1.cmp(&a.1));` gives `[("kiwi", 5), ("pear", 3), ("fig", 3)]`. The sort
   is stable, so `pear` stays ahead of `fig` as it was in the input.
3. A `VecDeque`: `push_back` to add a job, `pop_front` to take the oldest.

## Key takeaways

- `HashSet` for uniqueness, `BTreeMap` for sorted keys, `VecDeque` for queues.
- `entry(key)` plus `or_insert`, `or_default` or `and_modify` updates a map with one lookup.
- The `sort` family is stable; `b.cmp(a)` reverses; floats need `total_cmp`.
- Never depend on the iteration order of a hash-based collection.

## Further reading

- [Standard library: the `std::collections` module](https://doc.rust-lang.org/std/collections/index.html)
- [Standard library: `BTreeMap`](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html)
- [Standard library: the `Entry` type of `HashMap`](https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html)
- [Standard library: slice methods, including `sort_by`](https://doc.rust-lang.org/std/primitive.slice.html)
