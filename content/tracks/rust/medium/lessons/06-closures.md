---
title: Closures
summary: Write anonymous functions that remember the variables around them, predict how they capture, and pass them to and return them from other functions.
minutes: 25
objectives:
  - Write closures with inferred and with annotated types
  - Predict whether a closure borrows, mutably borrows or takes ownership of a variable
  - Choose the right bound among `Fn`, `FnMut` and `FnOnce` for a function parameter
  - Return a closure from a function with `impl Fn` and `move`
---

## Outline

1. Closure syntax
2. Capturing the environment
3. The `move` keyword
4. `Fn`, `FnMut` and `FnOnce`
5. Passing closures to functions
6. Returning closures

## Closure syntax

A **closure** is a function without a name that you can store in a variable or hand to another
function. Its parameters go between vertical bars and its body follows. Unlike a function
declared with `fn`, it can use variables from the scope it is written in.

```rust
fn main() {
    let add_one = |x: i32| -> i32 { x + 1 }; // fully annotated
    let double = |x| x * 2;                  // types inferred from use
    let rate = 3;
    let scale = |x| x * rate;                // `rate` comes from the enclosing scope

    println!("{} {} {}", add_one(4), double(4), scale(5));
}
```

```text
5 8 15
```

Annotations are optional because the compiler infers a closure's types from how it is used.
It infers them once: after `let same = |x| x;`, calling `same(String::from("hi"))` and then
`same(5)` is error E0308, "expected `String`, found integer".

## Capturing the environment

Using an outside variable is called **capturing** it. The compiler picks the least demanding
way that the body allows, in this order: a shared borrow if the body only reads, a mutable
borrow if it changes the value, and a move if it needs to own it.

```rust
fn main() {
    let names = vec![String::from("ada"), String::from("grace")];
    let count = || names.len();        // only reads: borrows `names`
    println!("{} {}", count(), names.len());

    let mut total = 0;
    let mut add = |n: i32| total += n; // changes: borrows `total` mutably
    add(2);
    add(5);
    println!("{total}");

    let keep = move || names;          // `move`: takes ownership of `names`
    let back = keep();
    println!("{back:?}");
}
```

```text
2 2
7
["ada", "grace"]
```

A closure that changes a captured variable must itself be declared `mut`, as `add` is. The
borrow lasts from the definition of the closure to its last use, and the usual borrowing rules
apply in between. Printing `total` between the two calls to `add` is refused:

```text
error[E0502]: cannot borrow `total` as immutable because it is also borrowed as mutable
  --> src/main.rs:9:16
   |
 7 |     let mut add = |n: i32| total += n; // changes: borrows `total` mutably
   |                   -------- ----- first borrow occurs due to use of `total` in closure
   |                   |
   |                   mutable borrow occurs here
 8 |     add(2);
 9 |     println!("{total}");
   |                ^^^^^ immutable borrow occurs here
10 |     add(5);
   |     --- mutable borrow later used here
```

The closure took the mutable borrow on line 7 and still needs it on line 10. Move the
`println!` below the last call.

## The `move` keyword

`move` before the bars forces the closure to take ownership of everything it captures. You
need it when the closure must outlive the scope it was created in, for example when a function
returns it.

For a `Copy` type such as an integer, "moving" means copying. The closure gets its own
separate value:

```rust
fn main() {
    let mut count = 0;
    let mut bump = move || {
        count += 1;
        count
    };
    bump();
    println!("{} {count}", bump());
}
```

```text
2 0
```

The closure's private `count` reaches 2, while the variable in `main` is still 0. Without
`move` the closure would borrow `count` mutably and both would be 2.

## `Fn`, `FnMut` and `FnOnce`

Every closure has its own anonymous type, which you cannot write down. Instead, each closure
automatically implements one or more of three standard traits, decided by what its body does
with the captured values.

| Trait | The body | Can be called |
| --- | --- | --- |
| `FnOnce` | may move a captured value out | once |
| `FnMut` | may change captured values | many times |
| `Fn` | only reads captured values | many times |

Every `Fn` closure is also `FnMut`, and every `FnMut` closure is also `FnOnce`, so a closure
that only reads implements all three. The trait depends on what the body *does*, not on the
`move` keyword. `move || names.len()` is still `Fn`. `move || names` above is only `FnOnce`,
because calling it gives `names` away, and a second call is error E0382.

## Passing closures to functions

A function takes a closure through a generic parameter bounded by one of these traits. The
bound also states the closure's parameter and return types. Ask for the least you need, so that
callers can pass as many closures as possible.

```rust
// Calls `f` twice, so it needs at least `FnMut`.
fn twice<F: FnMut()>(mut f: F) {
    f();
    f();
}

// Calls `f` once: `FnOnce` accepts every closure.
fn once<F: FnOnce() -> String>(f: F) -> String {
    f()
}

// Only needs to read, so it asks for `Fn`.
fn apply_all(values: &[i32], f: impl Fn(i32) -> i32) -> Vec<i32> {
    let mut out = Vec::new();
    for &value in values {
        out.push(f(value));
    }
    out
}

fn square(x: i32) -> i32 {
    x * x
}

fn main() {
    let mut hits = 0;
    twice(|| hits += 1);
    println!("{hits}");

    let name = String::from("ada");
    println!("{}", once(move || name));

    let offset = 10;
    println!("{:?}", apply_all(&[1, 2, 3], |x| x + offset));
    println!("{:?}", apply_all(&[1, 2, 3], square)); // a plain function works too
}
```

```text
2
ada
[11, 12, 13]
[1, 4, 9]
```

The standard library does the same. `Option::unwrap_or_else` calls its closure at most once
and takes an `FnOnce`. The sorting method `sort_by_key`, covered later, calls its closure
repeatedly and takes an `FnMut`.

## Returning closures

Because a closure's type has no name, a function returns one as `impl Fn...`, "some type that
implements this trait".

```rust
fn at_least(min: u32) -> impl Fn(u32) -> bool {
    move |qty| qty >= min
}

fn main() {
    let bulk = at_least(10);
    println!("{} {}", bulk(12), bulk(3));
}
```

```text
true false
```

`move` is essential here. Without it, `at_least` fails with error E0373, "closure may outlive
the current function, but it borrows `min`, which is owned by the current function". The
parameter `min` dies when `at_least` returns, so the closure must own its copy.

## Common mistakes

- **Touching a variable while a closure still borrows it mutably.** See E0502 above.
- **Asking for `Fn` when you mean `FnMut`.** `twice(|| hits += 1)` with the bound `F: Fn()` is
  error E0594, "cannot assign to `hits`, as it is a captured variable in a `Fn` closure".
- **Expecting `move` to affect the original `Copy` variable.** The closure changes its own copy.

## Practice

1. Which of `Fn`, `FnMut` and `FnOnce` does each closure implement?
   `let a = || println!("{}", text.len());` and `let b = || log.push(1);` and
   `let c = move || drop(text);`
2. Write `fn make_multiplier(factor: i32) -> impl Fn(i32) -> i32`.
3. A function calls its closure parameter three times and the closure may update a counter.
   Which bound should the parameter have?

### Answers

1. `a` only reads, so it implements all three. `b` changes `log`, so `FnMut` and `FnOnce`.
   `c` gives `text` away to `drop`, so only `FnOnce`.
2. `fn make_multiplier(factor: i32) -> impl Fn(i32) -> i32 { move |x| x * factor }`.
3. `FnMut`. `FnOnce` would allow one call only, and `Fn` would reject closures that change
   state.

## Key takeaways

- A closure captures by shared borrow, mutable borrow or move, whichever is the least its body
  needs. `move` forces ownership.
- Moving a `Copy` value into a closure copies it.
- `FnOnce`, `FnMut` and `Fn` describe what calling the closure does to its captures. Ask for
  the least demanding one, and return closures as `impl Fn...` with `move`.

## Further reading

- [The Rust Programming Language: Closures](https://doc.rust-lang.org/book/ch13-01-closures.html)
- [The Rust Reference: Closure types](https://doc.rust-lang.org/reference/types/closure.html)
- [Standard library: the `FnOnce` trait](https://doc.rust-lang.org/std/ops/trait.FnOnce.html)
- [Rust by Example: Capturing](https://doc.rust-lang.org/rust-by-example/fn/closures/capture.html)
