---
title: Box, Deref and Drop
summary: Put a value on the heap with `Box`, and meet `Deref` and `Drop`, the two traits that let a struct act like a pointer that cleans up after itself.
minutes: 25
objectives:
  - Use `Box<T>` to store a value on the heap and to define a recursive type
  - Implement `Deref` and predict where deref coercion applies
  - Implement `Drop` and state the order in which values are dropped
  - Release a value early with `drop` and explain why calling `.drop()` is rejected
---

## Outline

1. Smart pointers and `Box<T>`
2. Recursive types
3. `Deref`: using a pointer like the value
4. `Drop`: code that runs on cleanup
5. Drop order

## Smart pointers and `Box<T>`

A reference (`&T`) only borrows a value. A **smart pointer** is a struct that holds a pointer and also *owns* what it points to, so it decides when that value is freed. You have used two already: `String` and `Vec<T>` each own a buffer on the **heap**, the memory area for data whose size or lifetime is not fixed by one function call.

`Box<T>` is the simplest smart pointer. `Box::new(value)` moves `value` to the heap and hands you a pointer-sized handle with exactly one owner. When the box goes out of scope, the heap memory is freed. It is worth its one allocation in three situations:

- a type whose size cannot be known at compile time (recursive types, below);
- a large value you want to move without copying its bytes, because moving a box copies only the pointer;
- a value of "some type that implements this trait" (trait objects, lesson 3).

## Recursive types

The compiler must know the size of every type. An enum needs room for its largest variant, so a variant that contains the enum itself has no finite size.

```rust
enum Route {
    End,
    Hop(String, Route),
}
```

```text
error[E0072]: recursive type `Route` has infinite size
 --> src/main.rs:1:1
  |
1 | enum Route {
  | ^^^^^^^^^^
2 |     End,
3 |     Hop(String, Route),
  |                 ----- recursive without indirection
  |
help: insert some indirection (e.g., a `Box`, `Rc`, or `&`) to break the cycle
  |
3 |     Hop(String, Box<Route>),
  |                 ++++     +
```

Read it from the top: the first line names the problem, the dashes mark the field that causes it, and `help` shows the fix. "Indirection" means storing a pointer instead of the value. A pointer has the same size whatever it points to, so the size becomes computable.

```rust
enum Route {
    End,
    Hop(String, Box<Route>),
}

fn describe(route: &Route) -> String {
    match route {
        Route::End => String::from("end"),
        Route::Hop(city, rest) => format!("{city} > {}", describe(rest)),
    }
}

fn main() {
    let route = Route::Hop(
        String::from("lisbon"),
        Box::new(Route::Hop(String::from("madrid"), Box::new(Route::End))),
    );
    println!("{}", describe(&route));
    println!("{} bytes", std::mem::size_of::<Route>());
}
```

```text
lisbon > madrid > end
32 bytes
```

On a 64-bit machine that is 24 bytes for the `String` plus 8 for the box. Notice `describe(rest)`: `rest` is a `&Box<Route>`, yet the function wants a `&Route`. The next section explains why that compiles.

## `Deref`: using a pointer like the value

The `*` operator follows a reference to its value. A type opts in to `*` by implementing the `Deref` trait, whose one method returns a reference to the inner value. For such a type, `*x` means `*(x.deref())`.

`Deref` also switches on **deref coercion**: where a reference to your type is given but another reference type is expected, the compiler inserts `deref` calls until the types match. Method calls run the same search. It is all decided at compile time, so it costs nothing at run time.

```rust
use std::ops::Deref;

/// A list that always holds at least one number.
struct NonEmpty(Vec<i32>);

impl NonEmpty {
    fn new(first: i32) -> NonEmpty {
        NonEmpty(vec![first])
    }

    fn push(&mut self, number: i32) {
        self.0.push(number);
    }
}

impl Deref for NonEmpty {
    type Target = [i32];

    fn deref(&self) -> &[i32] {
        &self.0
    }
}

fn total(numbers: &[i32]) -> i32 {
    numbers.iter().sum()
}

fn main() {
    let mut readings = NonEmpty::new(4);
    readings.push(6);
    println!("{}", readings.len()); // `len` is a slice method
    println!("{}", total(&readings)); // &NonEmpty becomes &[i32]

    let boxed = Box::new(String::from("heap"));
    let text: &str = &boxed; // &Box<String> -> &String -> &str
    println!("{}", text.to_uppercase());
}
```

```text
2
10
HEAP
```

`NonEmpty` gets every read-only slice method for free, but not `clear`, so its guarantee holds. Mutable access needs a second trait, `DerefMut`. The coercions are: `&T` to `&U` when `T: Deref<Target = U>`; `&mut T` to `&mut U` when `T: DerefMut<Target = U>`; and `&mut T` to `&U`. A shared reference never becomes a mutable one, because other readers may exist.

## `Drop`: code that runs on cleanup

The `Drop` trait has one method, `drop(&mut self)`, which Rust calls automatically when a value's owner goes away. This is how a `Box` frees its memory, how a file is closed and, in lesson 5, how a lock is released. Implement it when your type holds something that must be given back.

## Drop order

```rust
struct Probe(&'static str);

impl Drop for Probe {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

struct Rig {
    left: Probe,
    right: Probe,
}

impl Drop for Rig {
    fn drop(&mut self) {
        println!("drop rig ({} and {} are still alive)", self.left.0, self.right.0);
    }
}

fn main() {
    let _a = Probe("a");
    let b = Probe("b");
    let _rig = Rig { left: Probe("left"), right: Probe("right") };
    drop(b);
    println!("end of main");
}
```

```text
drop b
end of main
drop rig (left and right are still alive)
drop left
drop right
drop a
```

Three rules explain this output:

- Local variables are dropped in **reverse** order of declaration, because a later variable may borrow from an earlier one.
- A value's own `drop` runs first, and then its fields are dropped in declaration order.
- `drop(b)` is an ordinary function (`std::mem::drop`) that takes ownership, so `b` is dropped at once and cannot be dropped twice.

Calling the method yourself is refused, because Rust would still drop the value at the end of the scope and free it a second time. Change `drop(b);` to `b.drop();` and you get:

```text
error[E0040]: explicit use of destructor method
  --> src/main.rs:24:7
   |
24 |     b.drop();
   |       ^^^^ explicit destructor calls not allowed
   |
help: consider using `drop` function
   |
24 -     b.drop();
24 +     drop(b);
```

## Common mistakes

- **Writing `let _ = make_guard();`.** The pattern `_` binds nothing, so the value is dropped immediately. A name such as `_guard` keeps it alive to the end of the scope.
- **Boxing everything.** `Box` is for recursive types, trait objects and large moves. For ordinary values the extra allocation only slows the program down.
- **Implementing `Deref` to imitate inheritance.** Use it for types that really are a pointer to, or a view of, their target. Otherwise method calls resolve in surprising ways.
- **Expecting a `Box` to be shared.** A box has one owner, and assigning it moves it. Shared ownership is `Rc`, in the next lesson.

## Practice

1. Define `enum Tree { Leaf(i32), Node(Box<Tree>, Box<Tree>) }` and write `fn sum(tree: &Tree) -> i32`.
2. Given `fn shout(text: &str) -> String` and `let name = Box::new(String::from("ada"));`, call `shout` without cloning. Which coercions happen?
3. With `Probe` from above, predict the output of `let _x = Probe("x"); let _ = Probe("y"); let _z = Probe("z"); println!("go");`.

### Answers

1. Match on the tree. Deref coercion turns each `&Box<Tree>` into a `&Tree`:

   ```rust
   fn sum(tree: &Tree) -> i32 {
       match tree {
           Tree::Leaf(value) => *value,
           Tree::Node(left, right) => sum(left) + sum(right),
       }
   }
   ```

2. `shout(&name)`. `&Box<String>` becomes `&String` through the `Deref` of `Box`, then `&str` through the `Deref` of `String`.
3. `drop y`, `go`, `drop z`, `drop x`. The `_` pattern drops `y` at once. The other two are dropped in reverse order when the scope ends.

## Key takeaways

- `Box<T>` is single ownership on the heap, with a known, pointer-sized handle.
- A recursive type needs indirection so that its size is finite.
- `Deref` makes `*` work and lets references coerce at compile time.
- `Drop` runs when the owner goes away: locals in reverse order, then fields in declaration order.
- Use `drop(value)` to clean up early. `.drop()` does not compile.

## Further reading

- [The Rust Programming Language: Using `Box<T>` to Point to Data on the Heap](https://doc.rust-lang.org/book/ch15-01-box.html)
- [The Rust Programming Language: Treating Smart Pointers Like Regular References](https://doc.rust-lang.org/book/ch15-02-deref.html)
- [Standard library: the `Deref` trait](https://doc.rust-lang.org/std/ops/trait.Deref.html)
- [The Rust Reference: Destructors](https://doc.rust-lang.org/reference/destructors.html)
