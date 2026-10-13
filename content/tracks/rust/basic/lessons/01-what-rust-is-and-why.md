---
title: What Rust Is and Why It Exists
summary: What kind of language Rust is, the bugs it was designed to prevent, where it is used, and how this course teaches it.
minutes: 15
objectives:
  - Describe Rust as a compiled, statically typed language without a garbage collector
  - Name three kinds of bug that the Rust compiler or runtime checks stop
  - Read the parts of a compiler error message
  - Explain how the lessons, the mock exam and the lab fit together
---

## Outline

1. What Rust is
2. The problem Rust solves
3. The compiler as a safety net
4. Speed and fearless concurrency
5. Where Rust is used
6. How this course works

## What Rust is

Rust is a programming language for software that has to be both fast and reliable. Its first
stable version, 1.0, was released in 2015. Three properties define it:

- **Compiled.** A program called the *compiler* (`rustc`) translates your source code into an
  *executable*, a file the computer can run directly. That happens before the program runs,
  and the person who runs it does not need Rust installed.
- **Statically typed.** Every value has a *type* (whole number, text and so on) that is known
  while compiling, so type mistakes are found before the program ever runs.
- **No garbage collector.** A *garbage collector* is a service inside languages such as Java,
  Go and JavaScript that runs alongside your code and finds memory the program no longer
  needs. Rust frees memory without one.

Here is a complete Rust program. You are not expected to understand every line yet. Each piece
is taught in the next few lessons.

```rust
fn main() {
    let boxes = [12, 30, 8];
    let mut total = 0;
    for count in boxes {
        total += count;
    }
    println!("{} pallets hold {total} boxes", boxes.len());
}
```

```text
3 pallets hold 50 boxes
```

## The problem Rust solves

A program keeps its data in memory, and every piece of memory must be handed back when it is
no longer needed. Older systems languages such as C leave that to the programmer. That is fast,
but easy to get wrong:

- **Use after free**: reading memory that was already handed back.
- **Double free**: handing the same memory back twice.
- **Buffer overread**: reading past the end of a list into memory that belongs to something
  else.

These mistakes cause crashes and security holes, and they often stay hidden until the program
is in use. A garbage collector removes most of them, at the price of extra work while the
program runs.

Rust takes a third route called **ownership**: a short set of rules about which part of the
program is responsible for each value. The compiler checks the rules while it compiles. When
they hold, it knows exactly where each value stops being needed and inserts the cleanup for
you. When they do not, it refuses to build the program. Nothing about ownership is checked
while the program runs, so the safety costs no speed.

## The compiler as a safety net

This program hands a piece of text from `label` to `moved`, then uses the old name again.

```rust
fn main() {
    let label = String::from("fragile");
    let moved = label;
    println!("{label} {moved}");
}
```

```text
error[E0382]: borrow of moved value: `label`
 --> src/main.rs:4:16
  |
2 |     let label = String::from("fragile");
  |         ----- move occurs because `label` has type `String`, which does not implement the `Copy` trait
3 |     let moved = label;
  |                 ----- value moved here
4 |     println!("{label} {moved}");
  |                ^^^^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let moved = label.clone();
  |                      ++++++++
```

Lesson 7 explains the rule that was broken. For now, learn the shape of the message, because
you will read many of them:

- The first line gives an **error code** and a one-line summary. Running
  `rustc --explain E0382` prints a longer explanation.
- The `-->` line gives the file, the line and the column.
- The excerpt of your code is marked up: `^^^^^` is where the problem is, and `-----` marks
  the earlier places that led to it.
- `help:` often shows the exact change that fixes it.

Some mistakes only show up while the program runs. Below, a position in a list is calculated,
and it turns out to be 5 in a list of three items. Rust does not hand back whatever happens
to be in memory there. It stops the program with a clear message, which is called a
**panic**.

```rust
fn main() {
    let boxes = [12, 30, 8];
    let position = boxes.len() + 2;
    println!("{}", boxes[position]);
}
```

```text
thread 'main' (57) panicked at src/main.rs:4:20:
index out of bounds: the len is 3 but the index is 5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

The number in parentheses is an internal identifier and will differ on your machine.

## Speed and fearless concurrency

A Rust executable contains your code and little else. No garbage collector runs beside it,
and no other program has to translate it while it runs. The official site describes Rust as
able to power performance-critical services and to run on embedded devices, which are small
computers built into other products.

*Concurrency* means doing several things at once, for example on several processor cores. Its
classic bug is the **data race**: two parts of a program use the same data at the same moment,
at least one of them changes it, and nothing coordinates them. The ownership rules that
prevent memory bugs also reject data races at compile time, which Rust programmers call
*fearless concurrency*. The Advanced level of this track covers it.

## Where Rust is used

- Command line tools, network services, WebAssembly modules that run in web browsers, and
  embedded devices are the four areas the official site highlights.
- The Android platform supports writing native operating system components in Rust, and
  parts of the Firefox browser are written in it.

The price is a strict compiler. Beginners spend real time fixing errors before anything runs.
That time replaces debugging sessions later.

## How this course works

This level has fourteen lessons that start from nothing and build in order. Each one has
runnable examples with their real output, a list of common mistakes, three practice exercises
with worked answers, and links to the official pages it rests on. Type the examples yourself
instead of pasting them, and read every error. Until you install Rust in the next lesson you
can run code in the browser at the Rust Playground, `play.rust-lang.org`.

The level ends with a mock exam, which draws ten questions from a larger bank, and a lab in
which you write a small parser that is compiled and tested automatically.

## Common mistakes

- **Thinking "safe" means "cannot fail".** Rust prevents memory bugs and data races. A program
  can still panic, and it can still calculate the wrong answer.
- **Skimming the error.** The summary line, the marked code and the `help:` line usually
  contain the fix. Read all three before changing anything.
- **Treating the compiler as an opponent.** Every rejected program is a bug you did not ship.
- **Assuming Rust is only for operating systems.** Command line tools and network services
  come first in the official list of things to build with it.

## Practice

1. Explain the difference between a compile-time error and a panic, with one example of each
   from this lesson.
2. In the `E0382` message above, which line and column does the error point to, and what fix
   does the compiler suggest?
3. Change the first program so that it describes four pallets, the last holding 10 boxes.
   What does it print?

### Answers

1. A compile-time error is reported by the compiler, and no program is produced. Using
   `label` after it was moved is one. A panic happens while the program runs: the program
   starts, then stops with a message. Reading position 5 of a three-item list is one.
2. Line 4, column 16. The suggestion is to write `label.clone()` on line 3, which makes a
   second copy of the text instead of handing the original over.
3. Add one number to the list, so that its first line reads `let boxes = [12, 30, 8, 10];`.
   Nothing else changes, because the count and the total are both worked out from the list.
   The program prints `4 pallets hold 60 boxes`.

## Key takeaways

- Rust is compiled and statically typed, and it frees memory without a garbage collector.
- Ownership rules, checked at compile time, rule out use after free, double free and data
  races.
- Access to memory that cannot be checked at compile time, such as a calculated position in
  a list, is checked at run time and ends in a panic, never in silent corruption.
- An error message has a code, a location, marked code and usually a suggested fix.

## Further reading

- [The Rust Programming Language: Introduction](https://doc.rust-lang.org/book/ch00-00-introduction.html)
- [The Rust website: why Rust and what to build with it](https://www.rust-lang.org/)
- [Comprehensive Rust: What is Rust?](https://google.github.io/comprehensive-rust/hello-world/what-is-rust.html)
- [Android Open Source Project: Android Rust introduction](https://source.android.com/docs/setup/build/rust/building-rust-modules/overview)
