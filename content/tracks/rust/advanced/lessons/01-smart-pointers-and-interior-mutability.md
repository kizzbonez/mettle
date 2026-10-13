---
title: Smart Pointers and Interior Mutability
summary: What to reach for when a value needs to live on the heap, have several owners, or change behind a shared reference.
minutes: 30
objectives:
  - Use `Box` for recursive types and trait objects
  - Share ownership with `Rc` and break reference cycles with `Weak`
  - Explain what `RefCell` checks, and when it panics
  - Map each single-threaded pointer type to its thread-safe counterpart
---

## Outline

1. `Box<T>`: one owner, on the heap
2. `Rc<T>` and `Weak<T>`: several owners
3. `RefCell<T>`: borrow rules checked at run time
4. Putting them together
5. `Arc<T>` and `Mutex<T>`: the same ideas across threads

## `Box<T>`: one owner, on the heap

`Box<T>` owns a value stored on the heap, and the box itself has a small, fixed size. That
makes recursive types possible, and it is how a trait object (`Box<dyn Trait>`) is owned.

```rust
enum Expr {
    Num(i64),
    Add(Box<Expr>, Box<Expr>),      // without Box, an Expr would contain itself
}

fn eval(expr: &Expr) -> i64 {
    match expr {
        Expr::Num(n) => *n,
        Expr::Add(left, right) => eval(left) + eval(right),
    }
}
```

## `Rc<T>` and `Weak<T>`: several owners

`Rc<T>` is a reference-counted pointer. `Rc::clone` adds an owner by incrementing a counter,
and the value is dropped when the last owner goes away. An `Rc` gives shared access only, and
its counter is not atomic, so it must stay on one thread.

Two `Rc`s that point at each other never reach zero, and leak. Break the cycle with `Weak<T>`,
a pointer that does not own: `upgrade()` returns `None` once the value is gone.

## `RefCell<T>`: borrow rules checked at run time

`RefCell<T>` lets you mutate through a shared reference. This is **interior mutability**.
`borrow()` and `borrow_mut()` enforce "many readers or one writer" while the program runs, and
panic when the rule is broken. Keep the guards they return short-lived. `Cell<T>` is the
cheaper relative for `Copy` values: it copies in and out and cannot panic.

## Putting them together

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

struct Folder {
    name: String,
    parent: RefCell<Weak<Folder>>,          // does not keep the parent alive
    children: RefCell<Vec<Rc<Folder>>>,     // keeps the children alive
}

fn folder(name: &str) -> Rc<Folder> {
    Rc::new(Folder {
        name: name.to_string(),
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(Vec::new()),
    })
}

fn main() {
    let root = folder("root");
    let logs = folder("logs");
    *logs.parent.borrow_mut() = Rc::downgrade(&root);
    root.children.borrow_mut().push(Rc::clone(&logs));

    assert_eq!(Rc::strong_count(&logs), 2);
    assert_eq!(Rc::strong_count(&root), 1);     // a Weak does not count
    let parent = logs.parent.borrow().upgrade().expect("root is alive");
    assert_eq!(parent.name, "root");
}
```

## `Arc<T>` and `Mutex<T>`: the same ideas across threads

| Single thread | Across threads          | Provides                     |
| ------------- | ----------------------- | ---------------------------- |
| `Rc<T>`       | `Arc<T>`                | shared ownership             |
| `RefCell<T>`  | `Mutex<T>`, `RwLock<T>` | interior mutability          |
| `Cell<T>`     | atomic integers         | interior mutability, no lock |

`Arc` counts with atomic operations. A `Mutex` blocks where a `RefCell` would panic, and
unlocks when its guard is dropped. `Rc<RefCell<T>>` and `Arc<Mutex<T>>` are one pattern at two
prices; pay for the thread-safe pair only when threads are involved.

## Key takeaways

- `Box` is single ownership on the heap: recursive types and trait objects.
- `Rc` and `Arc` share ownership; `Weak` breaks cycles.
- `RefCell` and `Mutex` move the borrow check to run time, where a mistake is a panic or a
  deadlock instead of a compile error.
- Start with plain ownership and borrowing, and add these only when the data really has
  several owners.
