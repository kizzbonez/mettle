---
title: Rc, RefCell and Interior Mutability
summary: Give one value several owners with `Rc`, change data behind a shared reference with `Cell` and `RefCell`, and stop reference cycles from leaking with `Weak`.
minutes: 30
objectives:
  - Share ownership with `Rc<T>` and read its strong and weak counts
  - Choose between `Cell<T>` and `RefCell<T>` and explain what each one checks
  - Predict when a `RefCell` borrow panics and restructure the code so that it does not
  - Break a reference cycle with `Weak<T>`
---

## Outline

1. `Rc<T>`: several owners
2. `Cell<T>`: interior mutability by copying
3. `RefCell<T>`: borrow rules checked at run time
4. `Rc<RefCell<T>>`: shared and changeable
5. Reference cycles and `Weak<T>`

## `Rc<T>`: several owners

A `Box` has one owner. Some data has no single obvious owner: a graph node reached from two places, or a setting read by several parts of a program, where you cannot say at compile time which part finishes last. `Rc<T>` (reference counted) solves this. It keeps the value on the heap next to a counter. `Rc::clone` adds an owner by adding one to the counter, without copying the value. Dropping an `Rc` subtracts one, and the value is freed when the counter reaches zero.

```rust
use std::rc::Rc;

fn main() {
    let track = Rc::new(String::from("Blue in Green"));
    let morning = vec![Rc::clone(&track)];
    {
        let evening = vec![Rc::clone(&track)];
        println!("owners: {}", Rc::strong_count(&track));
        println!("{}", evening[0].len());
    }
    println!("owners: {}", Rc::strong_count(&track));
    println!("{}", morning[0]);
}
```

```text
owners: 3
13
owners: 2
Blue in Green
```

Write `Rc::clone(&x)` and not `x.clone()`: it tells the reader that only a counter changes. Two limits follow from the design. The counter is not safe to update from two threads, so an `Rc` stays on one thread (lesson 4). And because several owners can read the value at once, an `Rc` gives out shared references only. Adding `track.push_str(" (live)");` after the line that creates `morning` is refused:

```text
error[E0596]: cannot borrow data in an `Rc` as mutable
 --> src/main.rs:6:5
  |
6 |     track.push_str(" (live)");
  |     ^^^^^ cannot borrow as mutable
  |
  = help: trait `DerefMut` is required to modify through a dereference, but it is not implemented for `Rc<String>`
```

## `Cell<T>`: interior mutability by copying

**Interior mutability** means changing a value through a shared reference (`&T`). The types that allow it keep the "many readers or one writer" rule but enforce it in another way than the compiler's borrow check.

`Cell<T>` enforces it by never lending out a reference at all. `get` returns a copy (so `T` must be `Copy`), and `set` or `replace` swaps in a whole new value. With no references into the cell, nothing can be left dangling, so a `Cell` has no run-time cost and cannot fail.

## `RefCell<T>`: borrow rules checked at run time

Copying does not suit a `Vec` or a `String`. `RefCell<T>` does lend references, and counts them while the program runs. `borrow()` returns a `Ref<T>` guard and `borrow_mut()` returns a `RefMut<T>` guard. Each guard behaves like a reference and ends the borrow when it is dropped.

```rust
use std::cell::{Cell, RefCell};

struct Sensor {
    reads: Cell<u32>,
    history: RefCell<Vec<i32>>,
}

impl Sensor {
    fn read(&self, value: i32) -> i32 {
        self.reads.set(self.reads.get() + 1);
        self.history.borrow_mut().push(value);
        value
    }
}

fn main() {
    let sensor = Sensor { reads: Cell::new(0), history: RefCell::new(Vec::new()) };
    sensor.read(21);
    sensor.read(23);
    println!("{} reads: {:?}", sensor.reads.get(), sensor.history.borrow());
}
```

```text
2 reads: [21, 23]
```

`read` takes `&self`, yet it records what happened. That is the typical use: bookkeeping inside a method that is logically read-only.

The price is that a broken rule is found late. Asking for a mutable borrow while any other borrow is alive, or for any borrow while a mutable one is alive, does not fail to compile. It **panics**.

```rust
use std::cell::RefCell;

fn main() {
    let queue = RefCell::new(vec![1, 2]);
    println!("free: {}", queue.try_borrow_mut().is_ok());
    for n in queue.borrow().iter() {
        if *n == 2 {
            queue.borrow_mut().push(3);
        }
    }
}
```

```text
free: true

thread 'main' (175) panicked at src/main.rs:8:19:
RefCell already borrowed
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

The guard made by `queue.borrow()` in the loop header lives until the loop ends, so the `borrow_mut` inside the loop finds the cell busy. The line and column in the message point at the borrow that failed, not at the one still open, so look for a guard that lives longer than you thought. (The number in parentheses is the thread's id and differs between runs.) `try_borrow` and `try_borrow_mut` return a `Result` instead of panicking.

## `Rc<RefCell<T>>`: shared and changeable

`Rc` gives several owners but no mutation. `RefCell` gives mutation but one owner. Together they give a value that several owners can change:

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let score = Rc::new(RefCell::new(10));
    let alias = Rc::clone(&score);
    *alias.borrow_mut() += 5;
    println!("{}", score.borrow());
}
```

```text
15
```

## Reference cycles and `Weak<T>`

If two `Rc` values point at each other, each keeps the other's counter above zero and neither is ever freed. That is a memory leak. It is safe, but it is a bug. `Weak<T>` is the fix: a pointer that does **not** own. `Rc::downgrade` creates one, and it raises the *weak* count, which does not keep the value alive. Because the value may be gone, you must call `upgrade()`, which returns `Option<Rc<T>>`.

In a tree, a parent owns its children, and a child only refers back to its parent:

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

struct Folder {
    name: String,
    parent: RefCell<Weak<Folder>>,
    children: RefCell<Vec<Rc<Folder>>>,
}

fn folder(name: &str) -> Rc<Folder> {
    Rc::new(Folder {
        name: name.to_string(),
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(Vec::new()),
    })
}

fn main() {
    let logs = folder("logs");
    {
        let root = folder("root");
        *logs.parent.borrow_mut() = Rc::downgrade(&root);
        root.children.borrow_mut().push(Rc::clone(&logs));

        println!("root: strong {}, weak {}", Rc::strong_count(&root), Rc::weak_count(&root));
        println!("logs: strong {}", Rc::strong_count(&logs));
        let parent = logs.parent.borrow().upgrade();
        println!("{:?}", parent.map(|p| p.name.clone()));
    }
    println!("{}", logs.parent.borrow().upgrade().is_none());
}
```

```text
root: strong 1, weak 1
logs: strong 2
Some("root")
true
```

`root` had one strong owner, so it was freed at the end of the inner block even though `logs` still pointed at it weakly. After that, `upgrade` returns `None`.

## Common mistakes

- **Keeping a `RefCell` guard alive across a call that borrows again.** Store what you need in a plain variable and let the guard go first.
- **Reaching for `Rc<RefCell<T>>` first.** It moves errors from compile time to run time. Try plain ownership and `&mut` before it.
- **Two-way strong links.** Decide which side owns. The other side holds a `Weak`.
- **Sending an `Rc` or a `RefCell` to another thread.** Neither is thread-safe. Lessons 4 and 5 cover `Arc` and `Mutex`.

## Practice

1. What does this print? `let a = Rc::new(5); let b = Rc::clone(&a); { let _c = Rc::clone(&b); } println!("{}", Rc::strong_count(&a));`
2. Change the panicking loop so that it adds `3` when the queue contains `2`, without panicking.
3. `struct Counter { hits: Cell<u32> }`. Write `fn hit(&self) -> u32`, which adds one and returns the new count.

### Answers

1. `2`. The inner clone is dropped at the end of its block, which leaves `a` and `b`.
2. Finish reading before writing, so that the two guards never overlap:

   ```rust
   let has_two = queue.borrow().contains(&2);
   if has_two {
       queue.borrow_mut().push(3);
   }
   ```

   The first guard is a temporary that is dropped at the end of its statement.
3. `fn hit(&self) -> u32 { self.hits.set(self.hits.get() + 1); self.hits.get() }`. No guard exists, so this can never panic.

## Key takeaways

- `Rc<T>` shares ownership on one thread. Cloning it only raises a counter.
- `Cell<T>` copies values in and out. `RefCell<T>` lends references and checks the borrow rules at run time.
- A `RefCell` mistake is a panic, so keep its guards short-lived.
- `Weak<T>` refers without owning. `upgrade` tells you whether the value is still there.
- Strong pointers go from owner to owned, and weak pointers go back.

## Further reading

- [The Rust Programming Language: `Rc<T>`, the Reference Counted Smart Pointer](https://doc.rust-lang.org/book/ch15-04-rc.html)
- [The Rust Programming Language: `RefCell<T>` and the Interior Mutability Pattern](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html)
- [Standard library: `std::cell`](https://doc.rust-lang.org/std/cell/index.html)
- [Standard library: `std::rc`](https://doc.rust-lang.org/std/rc/index.html)
