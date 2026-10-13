---
title: Iterators
summary: Process sequences with lazy pipelines of adapters and consumers, collect the results into any collection, and write an iterator of your own.
minutes: 30
objectives:
  - Describe the `Iterator` trait and choose among `iter`, `iter_mut` and `into_iter`
  - Tell an adapter from a consumer and explain why adapters alone do nothing
  - Build a pipeline and `collect` it into a `Vec`, a `String`, a map or a `Result`
  - Implement `Iterator` and `FromIterator` for your own types
---

## Outline

1. The `Iterator` trait
2. Three ways into a collection
3. Adapters are lazy
4. Consumers finish the job
5. `collect` and `FromIterator`
6. Writing your own iterator

## The `Iterator` trait

An **iterator** is a value that hands out a sequence of items one at a time. In Rust that is any
type implementing the standard trait `Iterator`, which has one required method:

`fn next(&mut self) -> Option<Self::Item>`

`Item` is an **associated type**: a type the implementor chooses, here the type of the items.
`next` returns `Some(item)` until the sequence is finished and `None` afterwards. A `for` loop is
a convenient way of calling `next` until it sees `None`.

## Three ways into a collection

```rust
fn main() {
    let mut names = vec![String::from("ada"), String::from("grace")];

    let mut iter = names.iter();
    println!("{:?} {:?} {:?}", iter.next(), iter.next(), iter.next());

    for name in names.iter_mut() { // &mut String: change in place
        name.push('!');
    }
    for name in &names {           // same as names.iter(): &String
        print!("{name} ");
    }
    for name in names {            // same as names.into_iter(): String
        print!("{} ", name.to_uppercase());
    }
    println!();
}
```

```text
Some("ada") Some("grace") None
ada! grace! ADA! GRACE! 
```

- `iter()` lends each item as `&T`.
- `iter_mut()` lends each item as `&mut T`, so you can change items in place.
- `into_iter()` consumes the collection and gives each item by value, `T`. After the last loop
  `names` has been moved and cannot be used.

The variable holding an iterator must be `mut` to call `next` on it, because every call advances
its position. A `for` loop handles that for you.

## Adapters are lazy

An **adapter** is a method that takes an iterator and returns a new one, such as `map`
(transform each item) or `filter` (keep the items for which a closure returns `true`). Adapters
are **lazy**: building the chain runs nothing. Work happens only when something asks the last
iterator for an item, and then each item travels through the whole chain before the next one
starts. `inspect`, an adapter that lets you peek at passing items, makes this visible.

```rust
fn main() {
    let total: u32 = [1, 2, 3]
        .iter()
        .inspect(|n| println!("filter sees {n}"))
        .filter(|n| **n != 2)
        .inspect(|n| println!("map sees {n}"))
        .map(|n| n * 10)
        .sum();
    println!("{total}");
}
```

```text
filter sees 1
map sees 1
filter sees 2
filter sees 3
map sees 3
40
```

There is no intermediate list of filtered values. The pipeline makes a single pass, which is
why it is usually as fast as a hand-written loop. `**n` appears because `iter()` yields `&u32`
and `filter` passes its closure a reference to the item, a `&&u32`.

| Adapter | Yields |
| --- | --- |
| `map(f)` | `f(item)` for each item |
| `filter(p)` | the items for which `p` is true |
| `filter_map(f)` | the `x` of every `Some(x)` that `f` returns |
| `enumerate()` | pairs `(index, item)` |
| `zip(other)` | pairs from two iterators, until either ends |
| `take(n)`, `skip(n)` | the first `n` items, or all but the first `n` |
| `rev()` | the items back to front |
| `copied()`, `cloned()` | `T` from an iterator over `&T` |

## Consumers finish the job

A **consumer** calls `next` until it has an answer. `sum`, `count`, `min`, `max` and `last` use
every item. `any`, `all`, `find` and `position` stop early. `fold(start, f)` threads a running
value through a closure, and `for_each(f)` runs a closure for its side effects.

A chain with no consumer does nothing, and the compiler says so:

```rust
fn main() {
    let ids = vec![1, 2, 3];
    ids.iter().map(|id| println!("checking {id}"));
    println!("done");
}
```

```text
warning: unused `Map` that must be used
 --> src/main.rs:3:5
  |
3 |     ids.iter().map(|id| println!("checking {id}"));
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  |
  = note: iterators are lazy and do nothing unless consumed
```

It is a warning, so the program still runs and prints only `done`. Use a `for` loop or
`for_each` when you want an action for each item.

## `collect` and `FromIterator`

`collect` is the consumer that builds a collection. It can build many kinds, so you must name
the target type; the item type can be left as `_` for the compiler to fill in.

```rust
use std::collections::HashMap;

fn main() {
    let words = ["pear", "fig", "plum"];

    let lengths: Vec<usize> = words.iter().map(|w| w.len()).collect();
    let initials: String = words.iter().map(|w| w.chars().next().unwrap()).collect();
    let by_word: HashMap<&str, usize> = words.iter().map(|w| (*w, w.len())).collect();
    println!("{lengths:?} {initials} {}", by_word["fig"]);

    let good: Result<Vec<u32>, _> = ["4", "8"].iter().map(|s| s.parse::<u32>()).collect();
    let bad: Result<Vec<u32>, _> = ["4", "x"].iter().map(|s| s.parse::<u32>()).collect();
    println!("{good:?} {}", bad.is_err());
}
```

```text
[4, 3, 4] pfp 3
Ok([4, 8]) true
```

A type can be collected into if it implements the trait `FromIterator`. `Vec`, `String` and the
maps all do. An iterator of `Result` values collects into a `Result` holding the collection: the
first `Err` stops the work and becomes the answer.

## Writing your own iterator

Implement `next` and every adapter and consumer comes for free, because they are default
methods of the trait. Implement `FromIterator` and `collect` can build your type.

```rust
struct Countdown {
    remaining: u32,
}

impl Iterator for Countdown {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.remaining == 0 {
            return None;
        }
        self.remaining -= 1;
        Some(self.remaining + 1)
    }
}

struct Stock {
    total: u32,
    lines: usize,
}

impl FromIterator<u32> for Stock {
    fn from_iter<I: IntoIterator<Item = u32>>(iter: I) -> Stock {
        let mut stock = Stock { total: 0, lines: 0 };
        for quantity in iter {
            stock.total += quantity;
            stock.lines += 1;
        }
        stock
    }
}

fn main() {
    let evens: Vec<u32> = Countdown { remaining: 6 }.filter(|n| n % 2 == 0).collect();
    println!("{evens:?}");

    let stock: Stock = Countdown { remaining: 4 }.collect();
    println!("{} units on {} lines", stock.total, stock.lines);
}
```

```text
[6, 4, 2]
10 units on 4 lines
```

`IntoIterator` is the trait for "anything a `for` loop accepts": iterators themselves, and
collections. The bound `I: IntoIterator<Item = u32>` therefore lets `from_iter` take any source
of `u32` values.

## Common mistakes

- **Forgetting the consumer.** A chain of adapters alone runs nothing.
- **Using `into_iter()` and then the collection.** The collection has been moved (E0382,
  "borrow of moved value"). Use `iter()` if you need it afterwards.
- **Calling `collect` without a target type.** The error is E0283, "type annotations needed".
  Write `let v: Vec<_> = ...` or `.collect::<Vec<_>>()`.
- **Indexing in a loop out of habit.** `for i in 0..v.len()` invites off-by-one mistakes.
  Iterate over the items, and use `enumerate()` when you need the index too.

## Practice

1. From `let nums = [3, 8, 5, 12];` build a `Vec<i32>` holding the squares of the even numbers.
2. What does `(1..=4).map(|n| n * 2).filter(|n| *n > 4).count()` return?
3. Turn `["7", "x", "9"]` into a `Vec<u32>` of the values that parse, skipping the rest.

### Answers

1. `let squares: Vec<i32> = nums.iter().filter(|n| **n % 2 == 0).map(|n| n * n).collect();`
   gives `[64, 144]`.
2. `2`. The doubled values are 2, 4, 6 and 8, and two of them are greater than 4.
3. `let ok: Vec<u32> = ["7", "x", "9"].iter().filter_map(|s| s.parse().ok()).collect();` gives
   `[7, 9]`. `ok()` turns a `Result` into an `Option`, and `filter_map` keeps the `Some` values.

## Key takeaways

- An iterator is anything with `next`. `iter`, `iter_mut` and `into_iter` yield `&T`, `&mut T`
  and `T`.
- Adapters build a lazy pipeline; a consumer runs it, one item at a time.
- `collect` builds whatever type you name, including a `Result` that stops at the first error.
- Implementing `next` gives your type the whole iterator toolkit.

## Further reading

- [The Rust Programming Language: Processing a Series of Items with Iterators](https://doc.rust-lang.org/book/ch13-02-iterators.html)
- [Standard library: the `std::iter` module](https://doc.rust-lang.org/std/iter/index.html)
- [Standard library: the `Iterator` trait](https://doc.rust-lang.org/std/iter/trait.Iterator.html)
- [Standard library: the `FromIterator` trait](https://doc.rust-lang.org/std/iter/trait.FromIterator.html)
