---
title: Lifetimes in Depth
summary: Annotate functions and structs that work with references, know when the compiler fills the annotations in for you, and read lifetime errors with confidence.
minutes: 30
objectives:
  - Add lifetime annotations to a function that returns a reference
  - Define and use a struct that holds a reference
  - Apply the three elision rules to predict the lifetimes of a signature
  - Read the usual lifetime errors (E0106, E0597, E0515) and choose the right fix
---

## Outline

1. Why a signature needs lifetimes
2. What the annotation promises
3. Annotate only what the result borrows from
4. Structs that hold references
5. The elision rules
6. The `'static` lifetime
7. Reading lifetime errors

## Why a signature needs lifetimes

The Basic level showed that every reference has a **lifetime**, the stretch of code in which it
is valid, and that the borrow checker refuses a reference that outlives its data. Inside one
function the compiler sees everything. Across a function call it reads only the signature, and
sometimes the signature does not say enough.

```rust
fn longer(a: &str, b: &str) -> &str {
    if a.len() >= b.len() { a } else { b }
}

fn main() {
    println!("{}", longer("kiwi", "fig"));
}
```

```text
error[E0106]: missing lifetime specifier
 --> src/main.rs:1:32
  |
1 | fn longer(a: &str, b: &str) -> &str {
  |              ----     ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `a` or `b`
```

The `help` line states the problem: a caller cannot tell how long the result stays valid.
A **lifetime parameter** answers that. It is a generic parameter whose name starts with an
apostrophe, declared in the same angle brackets as type parameters and written after the `&`.

## What the annotation promises

`fn longer<'a>(a: &'a str, b: &'a str) -> &'a str` says: there is some lifetime `'a` during
which both arguments are valid, and the result is valid for that same `'a`. In practice `'a`
becomes the overlap of the two arguments, the shorter of them. An annotation never makes
anything live longer. It only describes a relationship, and the compiler then holds both the
function body and every caller to it.

```rust
fn longer<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

fn main() {
    let city = String::from("Lisbon");
    let winner;
    {
        let town = String::from("Faro");
        winner = longer(&city, &town);
    }
    println!("{winner}");
}
```

```text
error[E0597]: `town` does not live long enough
  --> src/main.rs:10:32
   |
 9 |         let town = String::from("Faro");
   |             ---- binding `town` declared here
10 |         winner = longer(&city, &town);
   |                                ^^^^^ borrowed value does not live long enough
11 |     }
   |     - `town` dropped here while still borrowed
12 |     println!("{winner}");
   |                ------ borrow later used here
```

At run time `winner` would be `"Lisbon"`, which is still alive, but the compiler does not run
the code. The signature says the result may borrow from either argument, and `town` is gone by
line 12. Find three labels in this error every time: where the value is **declared**, where it
is **dropped**, and where the borrow is **later used**.

## Annotate only what the result borrows from

Parameters the result never borrows from need no annotation, and leaving them out gives
callers more freedom. Below, the result borrows from `text` only.

```rust
fn after<'a>(text: &'a str, word: &str) -> &'a str {
    match text.find(word) {
        Some(index) => &text[index + word.len()..],
        None => "",
    }
}

fn main() {
    let line = String::from("level=warn disk almost full");
    let rest;
    {
        let key = String::from("level=");
        rest = after(&line, &key);
    } // `key` is gone, and that is fine
    println!("{rest}");
}
```

```text
warn disk almost full
```

## Structs that hold references

A struct that stores a reference must declare a lifetime, and the struct value cannot outlive
the data it points to.

```rust
struct Excerpt<'a> {
    text: &'a str,
}

impl<'a> Excerpt<'a> {
    fn first_word(&self) -> &str {
        self.text.split(' ').next().unwrap_or("")
    }
}

fn main() {
    let book = String::from("Call me Ishmael. Some years ago");
    let excerpt = Excerpt { text: &book[..15] };
    println!("{} / {}", excerpt.text, excerpt.first_word());
}
```

```text
Call me Ishmael / Call
```

`impl<'a> Excerpt<'a>` declares the lifetime and then uses it, as `impl<T>` does for a type
parameter. Storing a reference to a value that is dropped while the struct is still in use
gives the same E0597 as before.

## The elision rules

Most signatures need no annotations, because the compiler fills them in with three fixed
rules. This is **lifetime elision**. Lifetimes on parameters are *input lifetimes* and those
on the return type are *output lifetimes*.

1. Each reference parameter without an annotation gets its own lifetime.
2. If there is exactly one input lifetime, every output lifetime gets it.
3. If one of the parameters is `&self` or `&mut self`, every output lifetime gets the lifetime
   of `self`.

If output lifetimes are still unknown after these rules, you get E0106 and must annotate.

| You write | The compiler reads |
| --- | --- |
| `fn first(s: &str) -> &str` | `fn first<'a>(s: &'a str) -> &'a str` (rules 1 and 2) |
| `fn first_word(&self) -> &str` | the result lives as long as `&self` (rule 3) |
| `fn longer(a: &str, b: &str) -> &str` | two input lifetimes, no `self`: error |

Rule 3 assumes the result borrows from `self`. In `Excerpt` the word really borrows from the
book, so `fn first_word(&self) -> &'a str` is more accurate and lets the result outlive the
`Excerpt`.

## The `'static` lifetime

`'static` means "valid for the whole run of the program". String literals are `&'static str`,
because their text is stored in the executable itself: `fn greeting() -> &'static str { "hello" }`.

When the compiler suggests adding `'static` to make an error go away, be suspicious. The real
cause is nearly always a reference that does not live long enough, and the usual cure is to
return an owned value such as a `String`.

## Reading lifetime errors

Three errors cover most cases. **E0106** means the signature is ambiguous: annotate the
parameters the result borrows from. **E0597** means a caller keeps a reference after the value
is dropped: find the three labels. **E0515** means a function tries to lend out a value it
owns, which is dropped when the function returns:

```rust
fn shout(text: &str) -> &str {
    let loud = text.to_uppercase();
    &loud
}

fn main() {
    println!("{}", shout("hi"));
}
```

```text
error[E0515]: cannot return reference to local variable `loud`
 --> src/main.rs:3:5
  |
3 |     &loud
  |     ^^^^^ returns a reference to data owned by the current function
```

No annotation fixes this. Return the owned value instead.

## Common mistakes

- **Giving every reference the same `'a`.** That ties unrelated arguments together and rejects
  valid callers.
- **Reaching for a reference field too early.** A struct with lifetimes is harder to store and
  return. Start with owned fields such as `String`.
- **Adding `'static` because the compiler mentioned it.** Fix the borrow instead.

## Practice

1. Write out the lifetimes the compiler infers for `fn trim_start(s: &str) -> &str`.
2. Does `fn pick(a: &str, b: &str, first: bool) -> &str` compile? If not, fix the signature.
3. Fix `shout` from the example above.

### Answers

1. `fn trim_start<'a>(s: &'a str) -> &'a str`, by rules 1 and 2.
2. No: two input lifetimes and no `self`, so E0106. The result can come from either argument:
   `fn pick<'a>(a: &'a str, b: &'a str, first: bool) -> &'a str`.
3. Return the owned string: `fn shout(text: &str) -> String { text.to_uppercase() }`.

## Key takeaways

- A lifetime annotation describes how the validity of references relates. It never extends it.
- Annotate only the parameters the result borrows from.
- Three elision rules cover most signatures; E0106 means they were not enough.
- A function cannot return a reference to its own local data. Return an owned value.

## Further reading

- [The Rust Programming Language: Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)
- [The Rust Reference: Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html)
- [Rust by Example: Explicit annotation](https://doc.rust-lang.org/rust-by-example/scope/lifetime/explicit.html)
