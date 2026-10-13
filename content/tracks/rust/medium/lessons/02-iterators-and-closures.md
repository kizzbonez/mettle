---
title: Iterators and Closures
summary: Process data with lazy pipelines instead of index loops, and understand exactly what a closure captures.
minutes: 30
objectives:
  - Explain the difference between an iterator adapter and a consumer
  - Rewrite a loop as a pipeline of `filter`, `map` and a consumer
  - Predict whether a closure borrows, mutably borrows or takes ownership of a variable
  - Pick the right bound among `Fn`, `FnMut` and `FnOnce`
---

## Outline

1. The `Iterator` trait
2. Adapters are lazy
3. Closures capture their environment
4. `Fn`, `FnMut` and `FnOnce`

## The `Iterator` trait

An iterator is any type with one method, `fn next(&mut self) -> Option<Self::Item>`. Everything
else (`map`, `filter`, `sum` and dozens more) is a default method built on `next`. A `for` loop
calls `next` until it returns `None`.

Collections offer three ways in: `iter()` yields `&T`, `iter_mut()` yields `&mut T`, and
`into_iter()` consumes the collection and yields `T`.

## Adapters are lazy

Methods such as `map` and `filter` are **adapters**. They return a new iterator and do no work.
Nothing runs until a **consumer** such as `collect`, `sum`, `count` or a `for` loop pulls items
through.

```rust
fn main() {
    let orders = [("tea", 3_u32), ("mug", 0), ("tin", 12)];

    let in_stock: Vec<&str> = orders
        .iter()
        .filter(|(_, qty)| *qty > 0)
        .map(|(name, _)| *name)
        .collect();                 // the pipeline runs here
    assert_eq!(in_stock, ["tea", "tin"]);

    let units: u32 = orders.iter().map(|(_, qty)| qty).sum();
    assert_eq!(units, 15);
}
```

The pipeline makes one pass and allocates only the final `Vec`; it is usually as fast as a
hand-written loop. A `map` whose result is never consumed does nothing at all, and the compiler
warns about it.

## Closures capture their environment

A closure is an anonymous function that can use variables from the scope it is written in. By
default it borrows each one in the least demanding way its body allows. `move` makes it take
ownership instead, which is required when the closure outlives that scope.

```rust
fn at_least(min: u32) -> impl Fn(u32) -> bool {
    move |qty| qty >= min       // owns its own copy of `min`
}

fn main() {
    let mut seen = 0;
    let mut note = |qty: u32| seen += qty;      // borrows `seen` mutably
    note(3);
    note(12);
    assert_eq!(seen, 15);

    let bulk = at_least(10);
    assert!(bulk(12) && !bulk(3));
}
```

Moving a `Copy` value such as an integer into a closure copies it: the closure changes its own
copy, not the original.

## `Fn`, `FnMut` and `FnOnce`

Every closure implements one or more of three traits, decided by what its body does with the
captured variables.

| Trait    | The body                        | Can be called                  |
| -------- | ------------------------------- | ------------------------------ |
| `FnOnce` | may move a captured value out   | once                           |
| `FnMut`  | may modify captured state       | repeatedly, through `&mut`     |
| `Fn`     | only reads                      | repeatedly, through `&`        |

A closure that only reads implements all three. Functions should ask for the least they need:
`Iterator::map` takes an `FnMut`, and `thread::spawn` takes an `FnOnce` because it calls the
closure once.

## Key takeaways

- Adapters build a pipeline; only a consumer runs it.
- Prefer `iter().filter().map().collect()` to index loops: no bounds checks, no off-by-one.
- Closures borrow by default; `move` transfers ownership or copies `Copy` values.
- Ask for `FnOnce` if you call a closure once, `FnMut` if it may mutate, `Fn` otherwise.
