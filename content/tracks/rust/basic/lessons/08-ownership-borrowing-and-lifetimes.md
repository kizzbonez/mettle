---
title: References, Borrowing and a First Look at Lifetimes
summary: Let code use a value without owning it, learn the two borrowing rules and the bugs they prevent, and see what a lifetime is.
minutes: 30
objectives:
  - Borrow a value with a shared or a mutable reference instead of moving it
  - State the borrowing rules and name the bugs they prevent
  - Read errors E0502, E0597 and E0106 and fix the code that caused them
  - Explain what a lifetime is and why some signatures need a lifetime annotation
---

## Outline

1. Borrowing with `&`
2. Mutable references
3. The borrowing rules
4. Why the rules exist
5. Dangling references
6. A first look at lifetimes

## Borrowing with `&`

The last lesson ended with a nuisance: giving a `String` to a function gives it away. A
*reference* solves that. It refers to a value without owning it, and making one is called
*borrowing*. `&label` borrows `label`, and the type of the reference is `&String`.

```rust
fn length_of(label: &String) -> usize {
    label.len()
}

fn main() {
    let label = String::from("crate 9");
    let size = length_of(&label);
    println!("{label} has {size} bytes");
}
```

```text
crate 9 has 7 bytes
```

`main` still owns the text, so it can use `label` after the call. When the function ends, its
reference goes away and nothing is dropped, because a reference never owned anything.

## Mutable references

A plain `&` reference is *shared*: it can read the value and cannot change it. To change a
borrowed value you need a *mutable reference*, written `&mut`.

```rust
fn add_stamp(label: &mut String) {
    label.push_str(" [checked]");
}

fn main() {
    let mut label = String::from("crate 9");
    add_stamp(&mut label);
    println!("{label}");

    let mut count = 10;
    let counter = &mut count;
    *counter += 1;
    println!("{count}");
}
```

```text
crate 9 [checked]
11
```

Three things must agree: the variable is `mut`, the call passes `&mut label`, and the
parameter type is `&mut String`. The `*` in `*counter += 1` *dereferences*: it reaches the
value that the reference points to. Method calls such as `label.push_str(...)` do that for
you.

## The borrowing rules

1. At any moment a value may have **either** any number of shared references **or** exactly
   one mutable reference.
2. A reference must never outlive the value it refers to.

Breaking the first rule looks like this:

```rust
fn main() {
    let mut label = String::from("crate 9");
    let reader = &label;
    label.push_str(" [checked]");
    println!("{reader}");
}
```

```text
error[E0502]: cannot borrow `label` as mutable because it is also borrowed as immutable
 --> src/main.rs:4:5
  |
3 |     let reader = &label;
  |                  ------ immutable borrow occurs here
4 |     label.push_str(" [checked]");
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ mutable borrow occurs here
5 |     println!("{reader}");
  |                ------ immutable borrow later used here
```

The compiler calls a shared borrow an *immutable* borrow. The three marks are the whole
diagnosis: a shared borrow starts on line 3, `push_str` needs a mutable borrow on line 4,
and the shared one is still in use on line 5. A borrow lasts
until the **last use** of the reference, not until the end of the block. So the fix is to
finish reading first:

```rust
fn main() {
    let mut label = String::from("crate 9");
    let reader = &label;
    println!("{reader}");
    label.push_str(" [checked]");
    println!("{label}");
}
```

```text
crate 9
crate 9 [checked]
```

## Why the rules exist

`push_str` may need a bigger block of heap memory. If so, the `String` copies its text to a
new block and frees the old one. A reference that pointed into the old block, which is what
the slices of the next lesson do, would then point at freed memory. That is the
use-after-free bug from lesson 1. "Many readers or one writer" makes the whole class of bug
impossible, whatever the reference points at. The same rule rejects data races when a
program does several things at the same time. All of it is checked while compiling, so it
costs nothing while the program runs.

## Dangling references

A *dangling reference* points at a value that no longer exists. Rule 2 forbids it.

```rust
fn main() {
    let reference;
    {
        let label = String::from("crate 9");
        reference = &label;
    }
    println!("{reference}");
}
```

```text
error[E0597]: `label` does not live long enough
 --> src/main.rs:5:21
  |
4 |         let label = String::from("crate 9");
  |             ----- binding `label` declared here
5 |         reference = &label;
  |                     ^^^^^^ borrowed value does not live long enough
6 |     }
  |     - `label` dropped here while still borrowed
7 |     println!("{reference}");
  |                --------- borrow later used here
```

`label` is dropped at the inner brace while `reference` is still needed afterwards. For the
same reason a function cannot return a reference to one of its own local variables: they are
dropped when it ends. Return the value itself, which moves it out to the caller.

## A first look at lifetimes

A **lifetime** is the stretch of code in which a reference is valid. Every reference has one,
and the compiler normally works it out without help. "Does not live long enough" was a
lifetime check.

A function is checked using its signature alone. With one reference parameter there is no
question: the compiler assumes that a returned reference borrows from it. With two, it
cannot tell which one the result borrows from. (Methods, the subject of lesson 10, have one
more rule: a reference they return is assumed to borrow from `self`.) The example uses
`&str`, the type of borrowed text such as a string literal, which the next lesson covers.

```rust
fn shorter(first: &str, second: &str) -> &str {
    if first.len() <= second.len() { first } else { second }
}

fn main() {
    println!("{}", shorter("pallet", "box"));
}
```

```text
error[E0106]: missing lifetime specifier
 --> src/main.rs:1:42
  |
1 | fn shorter(first: &str, second: &str) -> &str {
  |                   ----          ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `first` or `second`
help: consider introducing a named lifetime parameter
  |
1 | fn shorter<'a>(first: &'a str, second: &'a str) -> &'a str {
  |           ++++         ++               ++          ++
```

The suggested signature compiles, and the program prints `box`. `'a` is a *lifetime
parameter*, a name for a lifetime. Using it on both parameters and on the result says: the
result is valid only while both `first` and `second` are. An annotation never makes a value
live longer. It describes how references relate, so that the compiler can check every caller.

One lifetime has a fixed name: `'static` means "valid for the whole run of the program".
String literals are built into the executable, so their type in full is `&'static str`. The
Medium level covers annotations in depth.

## Common mistakes

- **Forgetting the `&` at the call.** `length_of(label)` fails with "expected `&String`, found
  `String`", and the compiler suggests "consider borrowing here".
- **Changing a value through a shared reference.** Error `E0596` says the value is behind a
  `&` reference. Use `&mut` in the parameter type and at the call, and make the variable `mut`.
- **Two mutable references at once.** Error `E0499`. Finish using the first before making the
  second.
- **Keeping a reference across a change.** Error `E0502`. Use the reference for the last time
  before the change, as in the fixed example.
- **Returning a reference to a local variable.** Return the owned value instead.
- **Adding `'static` because an error message mentions it.** That is rarely the fix. The
  message usually means a value is dropped too early.

## Practice

1. Write `add_exclamation(text: &mut String)`, which appends `!`. Call it twice on the same
   `String` and print the result.
2. Why does this fail to compile, and how can it be changed so that it prints `10` and then
   `15`?

```rust
fn main() {
    let mut total = 10;
    let view = &total;
    total += 5;
    println!("{view} {total}");
}
```

3. Which of these signatures needs a lifetime annotation?
   `fn first(text: &str) -> &str`, `fn pick(a: &str, b: &str) -> &str` and
   `fn count(a: &str, b: &str) -> usize`.

### Answers

**1.** The variable, the call and the parameter all say `mut`.

```rust
fn add_exclamation(text: &mut String) {
    text.push_str("!");
}

fn main() {
    let mut greeting = String::from("hello");
    add_exclamation(&mut greeting);
    add_exclamation(&mut greeting);
    println!("{greeting}");
}
```

```text
hello!!
```

**2.** `view` is a shared borrow of `total`, and it is still used on the last line, so
`total` cannot be changed in between (error `E0506`). Split the printing in two: print
`view` first, then add 5, then print `total`. After its last use the borrow is over.

**3.** Only `pick`. `first` has a single reference parameter, so the result can only borrow
from it. `count` returns a number, which borrows from nothing.

## Key takeaways

- A `&` reference lends a value for reading and a `&mut` reference lends it for changing.
  Neither takes ownership.
- Many shared references or one mutable reference, never both at once.
- A borrow ends at the last use of the reference.
- A reference may not outlive its value. A lifetime is the span in which a reference is
  valid, and an annotation such as `'a` only describes how lifetimes relate.

## Further reading

- [The Rust Programming Language: References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)
- [The Rust Programming Language: Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)
- [Rust by Example: Borrowing](https://doc.rust-lang.org/rust-by-example/scope/borrow.html)
