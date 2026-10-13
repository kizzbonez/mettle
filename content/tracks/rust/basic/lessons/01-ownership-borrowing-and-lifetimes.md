---
title: Ownership, Borrowing and Lifetimes
summary: The rules that let Rust free memory without a garbage collector and reject dangling references at compile time.
minutes: 25
objectives:
  - State the ownership rules and predict whether a value is moved or copied
  - Choose between passing a value, a shared reference and a mutable reference
  - Explain what a lifetime annotation promises and when the compiler asks for one
---

## Outline

1. One owner at a time
2. Moves and copies
3. Borrowing: shared or exclusive
4. Lifetimes

## One owner at a time

Every value has exactly one **owner**: the variable or field that holds it. When the owner goes
out of scope the value is dropped and its memory is freed. There is no garbage collector and no
manual `free`; the compiler inserts the cleanup at the end of the owner's scope.

## Moves and copies

Assigning a value, or passing it to a function, **moves** it. The old name can no longer be
used.

```rust
fn main() {
    let a = String::from("dock");
    let b = a;              // ownership moves to b
    // println!("{a}");     // error[E0382]: borrow of moved value: `a`
    let c = b.clone();      // an explicit deep copy
    println!("{b} {c}");

    let x = 5;
    let y = x;              // i32 is Copy, so x is still usable
    println!("{x} {y}");
}
```

Simple values such as integers, `bool`, `char` and shared references implement `Copy`, so
assignment duplicates them. Types that own heap memory, such as `String` and `Vec<T>`, are
never `Copy`.

## Borrowing: shared or exclusive

Most functions only need to look at a value, not own it. A **reference** borrows it instead.

- `&T` is a shared reference. Any number may exist at once, and none of them can modify the
  value.
- `&mut T` is an exclusive reference. While it is in use, nothing else may read or write the
  value.

```rust
fn total(items: &[u32]) -> u32 {
    items.iter().sum()
}

fn main() {
    let mut stock = vec![4, 8];
    let sum = total(&stock);    // the shared borrow ends here
    stock.push(sum);            // so a mutable borrow is allowed
    println!("{stock:?}");
}
```

"Many readers or one writer" is checked at compile time. It rules out data races, and
modifying a collection while iterating over it. A borrow lasts until its last use, not until
the end of the block.

## Lifetimes

A reference must never outlive the value it points to. The compiler tracks this with
**lifetimes**, and usually infers them. When a function returns a reference and takes more than
one, you must say which input the output borrows from:

```rust
fn longer<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}
```

`'a` does not change how long anything lives. It is a promise callers can rely on: the result
is valid only while both `a` and `b` are valid. The compiler reads this from the signature
alone and never looks into the body to work it out.

## Key takeaways

- One owner per value; the value is dropped when its owner goes out of scope.
- Assignment moves unless the type is `Copy`. Call `clone` when you need a second owner.
- Any number of `&T`, or exactly one `&mut T`, never both at once.
- Lifetime annotations describe how references relate. They do not extend anything.
