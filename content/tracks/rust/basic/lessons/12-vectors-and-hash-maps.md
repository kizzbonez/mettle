---
title: Vectors and Hash Maps
summary: Keep a growing list of values in a Vec and look values up by key in a HashMap, and see how ownership and borrowing apply to both.
minutes: 30
objectives:
  - Create a `Vec<T>`, add and remove elements, and read them with indexing or `get`
  - Iterate over a vector by shared reference, by mutable reference and by value
  - Create a `HashMap<K, V>` and insert, look up and update its entries
  - Explain what a collection owns and why it cannot change while it is borrowed
---

## Outline

1. A list that grows: `Vec<T>`
2. Reading elements
3. Iterating
4. Ownership and borrowing
5. Looking things up: `HashMap<K, V>`
6. Updating an entry

## A list that grows: `Vec<T>`

A *collection* is a value that holds many values. An array is one, but its length is fixed. A
*vector*, written `Vec<T>`, can grow and shrink. Its elements all have one type `T`, and they
live on the heap.

```rust
fn main() {
    let mut weights: Vec<u32> = Vec::new();
    weights.push(12);
    weights.push(7);
    weights.push(31);
    println!("{weights:?} has {} items", weights.len());

    let mut codes = vec!["KB-204", "CBL-9", "ZX-1"];
    println!("{} {:?} {:?}", codes[0], codes.get(1), codes.get(10));

    let last = codes.pop();
    println!("{last:?} {codes:?}");
    println!("{} {}", codes.contains(&"CBL-9"), codes.is_empty());
}
```

```text
[12, 7, 31] has 3 items
KB-204 Some("CBL-9") None
Some("ZX-1") ["KB-204", "CBL-9"]
true false
```

`Vec::new()` makes an empty vector, and the macro `vec![...]` makes one with content. `push`
adds to the end, and `pop` removes the last element and returns it as an `Option`, because
the vector might be empty. Both change the vector, so it must be `mut`.

## Reading elements

There are two ways to read by position, and they differ in what happens past the end.

- `codes[0]` gives the element, and **panics** when the position does not exist.
- `codes.get(1)` gives an `Option`: `Some(&element)`, or `None` when the position does not
  exist.

Index when a wrong position would be a bug in your program. Use `get` when it can happen in
normal operation. `first()` and `last()` return an `Option` in the same way.

## Iterating

```rust
fn total(weights: &[u32]) -> u32 {
    let mut sum = 0;
    for weight in weights {
        sum += weight;
    }
    sum
}

fn main() {
    let mut weights = vec![12, 7, 31];
    for weight in &mut weights {
        *weight += 1;
    }
    for (index, weight) in weights.iter().enumerate() {
        println!("parcel {index}: {weight} kg");
    }
    println!("total {}", total(&weights));

    let fields: Vec<&str> = "KB-204,in,40".split(',').collect();
    println!("{fields:?} has {} fields", fields.len());

    let labels = vec![String::from("north"), String::from("south")];
    for label in labels {
        println!("{label}");
    }
}
```

```text
parcel 0: 13 kg
parcel 1: 8 kg
parcel 2: 32 kg
total 53
["KB-204", "in", "40"] has 3 fields
north
south
```

What comes after `in` decides what the loop receives:

- `&weights`, or a slice such as the parameter of `total`, lends the elements. Each `weight`
  is a `&u32`, and the vector is untouched.
- `&mut weights` lends them for changing. Each `weight` is a `&mut u32`, changed through `*`.
- `labels` on its own **moves** the vector into the loop. Each `label` is an owned `String`,
  and `labels` cannot be used afterwards.

Three more tools appear here. A parameter of type `&[u32]` accepts `&weights`, because a
borrowed vector can be used as a slice. `.iter().enumerate()` pairs every element with its
position, counting from zero. And `.collect()` gathers the pieces that `split` produces into
a new collection. It needs to be told which kind, hence the annotation `Vec<&str>`.

## Ownership and borrowing

A vector owns its elements. Pushing a `String` moves it into the vector, and dropping the
vector drops everything in it. A reference to an element borrows the whole vector:

```rust
fn main() {
    let mut weights = vec![12, 7, 31];
    let heaviest = &weights[2];
    weights.push(40);
    println!("{heaviest}");
}
```

```text
error[E0502]: cannot borrow `weights` as mutable because it is also borrowed as immutable
 --> src/main.rs:4:5
  |
3 |     let heaviest = &weights[2];
  |                     ------- immutable borrow occurs here
4 |     weights.push(40);
  |     ^^^^^^^^^^^^^^^^ mutable borrow occurs here
5 |     println!("{heaviest}");
  |                -------- immutable borrow later used here
```

This is the rule from lesson 8, and here its reason is concrete. When a vector runs out of
room, `push` moves all the elements to a bigger block of memory and frees the old one.
`heaviest` would be left pointing at freed memory. For the same reason you cannot `push` to a
vector inside a `for` loop that is iterating over it.

## Looking things up: `HashMap<K, V>`

A *hash map* stores pairs of a *key* and a *value* and finds a value by its key. Unlike
`Vec` and `String`, it has to be brought into scope with a `use` line.

```rust
use std::collections::HashMap;

fn main() {
    let mut stock: HashMap<String, u32> = HashMap::new();
    stock.insert(String::from("KB-204"), 40);
    stock.insert(String::from("CBL-9"), 300);
    stock.insert(String::from("KB-204"), 28);

    println!("{:?} {:?}", stock.get("KB-204"), stock.get("NOPE"));
    println!("{}", stock.get("NOPE").copied().unwrap_or(0));
    println!("{} {}", stock.len(), stock.contains_key("CBL-9"));

    if let Some(count) = stock.get_mut("CBL-9") {
        *count -= 100;
    }
    println!("{:?}", stock.remove("CBL-9"));

    for (code, count) in &stock {
        println!("{code}: {count}");
    }
}
```

```text
Some(28) None
0
2 true
Some(200)
KB-204: 28
```

- `insert` adds a pair. Inserting a key that already exists **replaces** its value, which is
  why `KB-204` ends at 28. The map takes ownership of the key and the value.
- `get` returns an `Option<&V>`, because the key may be missing. `.copied()` turns an
  `Option<&u32>` into an `Option<u32>`, and `.unwrap_or(0)` supplies a value for `None`.
- `get_mut` lends the value for changing, and `remove` takes the pair out and returns the
  value inside an `Option`.
- A `for` loop over `&stock` visits every pair in **no particular order**. Never rely on the
  order of a hash map.

## Updating an entry

Counting is the classic use of a map: look up the key, start at zero if it is new, add one.

```rust
use std::collections::HashMap;

fn main() {
    let scans = ["KB-204", "CBL-9", "KB-204", "KB-204"];
    let mut counts = HashMap::new();
    for code in scans {
        let count = counts.entry(code).or_insert(0);
        *count += 1;
    }
    println!("{:?} {:?}", counts.get("KB-204"), counts.get("CBL-9"));
    println!("{} different codes", counts.len());
}
```

```text
Some(3) Some(1)
2 different codes
```

`entry(code).or_insert(0)` returns a mutable reference to the value for that key, and first
inserts 0 if the key was missing. The types of the map were inferred from how it is used.

## Common mistakes

- **Indexing past the end.** `weights[3]` on three elements panics with "index out of bounds:
  the len is 3 but the index is 3". Use `get` when the position is not certain.
- **Changing a vector while a reference into it is alive.** Error `E0502`. Finish using the
  reference first, or copy the value out.
- **Looping with `for x in v` and then using `v`.** The loop moved the vector. The compiler
  suggests iterating over `&v`.
- **Forgetting the `use` line.** `HashMap::new()` then fails with "use of undeclared type
  `HashMap`", and the `help` shows the line to add.
- **Using a `String` after inserting it.** `stock.insert(code, 40)` moved `code` into the map.
- **Treating `get` as if it returned the value.** It returns an `Option` of a reference.

## Practice

1. Write `largest(values: &[i32]) -> Option<i32>`. What should it return for an empty slice?
2. Use a loop and `push` to build a vector of the even numbers from 1 to 10.
3. Count the words of `"the quick the lazy the end"` in a `HashMap`. Print how often `the`
   and `dog` occur.

### Answers

```rust
use std::collections::HashMap;

fn largest(values: &[i32]) -> Option<i32> {
    if values.is_empty() {
        return None;
    }
    let mut best = values[0];
    for value in values {
        if *value > best {
            best = *value;
        }
    }
    Some(best)
}

fn main() {
    println!("{:?} {:?}", largest(&[3, 9, 2]), largest(&[]));

    let mut evens = Vec::new();
    for number in 1..=10 {
        if number % 2 == 0 {
            evens.push(number);
        }
    }
    println!("{evens:?}");

    let mut counts = HashMap::new();
    for word in "the quick the lazy the end".split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    let the = counts.get("the").copied().unwrap_or(0);
    let dog = counts.get("dog").copied().unwrap_or(0);
    println!("{the} {dog}");
}
```

```text
Some(9) None
[2, 4, 6, 8, 10]
3 0
```

1. An empty slice has no largest element, so the honest answer is `None`. Indexing
   `values[0]` is safe only after the emptiness check.
2. The element type is inferred from the first `push`.
3. `dog` is not a key, so `get` gives `None` and `unwrap_or(0)` turns that into 0.

## Key takeaways

- `Vec<T>` is a growable list. `push` and `pop` work at the end, indexing panics past the
  end, and `get` returns an `Option`.
- `for x in &v` borrows, `for x in &mut v` allows changes, and `for x in v` consumes the
  vector.
- `HashMap<K, V>` maps keys to values. `get` returns an `Option`, `insert` replaces, and
  `entry(...).or_insert(...)` updates in place.
- Collections own their contents and cannot be changed while a reference into them is in use.

## Further reading

- [The Rust Programming Language: Storing Lists of Values with Vectors](https://doc.rust-lang.org/book/ch08-01-vectors.html)
- [The Rust Programming Language: Storing Keys with Associated Values in Hash Maps](https://doc.rust-lang.org/book/ch08-03-hash-maps.html)
- [Standard library: Vec](https://doc.rust-lang.org/std/vec/struct.Vec.html)
- [Standard library: HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html)
