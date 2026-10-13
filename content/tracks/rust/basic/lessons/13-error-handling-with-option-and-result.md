---
title: Error Handling with Option and Result
summary: Tell bugs from expected failures, report failures as Result values, pass them to the caller with the question mark operator, and keep panics for bugs.
minutes: 30
objectives:
  - Choose between `Option`, `Result` and a panic for a given situation
  - Handle a `Result` with `match`, `unwrap_or` and `let ... else`
  - Propagate errors with `?` and say what it does for `Err` and for `None`
  - Define an error enum that tells callers what went wrong
---

## Outline

1. Two kinds of failure
2. `Result`: success or an error
3. Shortcuts, and the ones that panic
4. Your own error type
5. Passing errors up with `?`
6. `?` on `Option`
7. When to panic

## Two kinds of failure

- A **bug**: the program reached a state its author thought impossible, such as a position
  past the end of a list. Rust responds with a *panic*: it prints a message, cleans up and
  stops.
- An **expected failure**: bad input, a missing file, a refused connection. The caller can
  react by reporting it, retrying or using a default.

Rust has no exceptions, the mechanism by which many languages interrupt a program when
something fails. An expected failure is an ordinary return value, so a function's signature
shows whether it can fail, and the caller cannot reach the result without dealing with the
failure case.

## `Result`: success or an error

`Result<T, E>` is an enum with the variants `Ok(value)` and `Err(error)`. `T` is the type of
the success value and `E` the type of the error. The standard example is `parse`, which turns
text into a number:

```rust
fn main() {
    for text in ["40", "forty", "-3", ""] {
        match text.parse::<u32>() {
            Ok(count) => println!("{text:?} is the number {count}"),
            Err(error) => println!("{text:?} failed: {error}"),
        }
    }
}
```

```text
"40" is the number 40
"forty" failed: invalid digit found in string
"-3" failed: invalid digit found in string
"" failed: cannot parse integer from empty string
```

The `::<u32>` after `parse` names the type to produce. `-3` fails because a `u32` has no
negative values. `parse` also rejects surrounding spaces, so call `trim()` first on anything
a person typed.

## Shortcuts, and the ones that panic

```rust
fn main() {
    let weights = [12, 7];
    println!("{}", "40".parse::<u32>().unwrap_or(0));
    println!("{}", "forty".parse::<u32>().unwrap_or(0));
    println!("{:?}", "forty".parse::<u32>().ok());
    println!("{:?}", weights.get(5).ok_or("no such parcel"));
    println!("{}", "forty".parse::<u32>().is_err());
    println!("{}", "40".parse::<u32>().unwrap() + 2);
}
```

```text
40
0
None
Err("no such parcel")
true
42
```

| Method | What you get |
| --- | --- |
| `unwrap_or(default)` | The value inside, or the default |
| `is_some()`, `is_none()`, `is_ok()`, `is_err()` | A `bool` |
| `ok()` | Turns a `Result` into an `Option` and discards the error |
| `ok_or(error)` | Turns an `Option` into a `Result` with the error you supply |
| `unwrap()`, `expect("why")` | The value inside, or a **panic** |

The last row is different in kind. It turns a failure into a crash:

```rust
fn main() {
    let text = "forty";
    let count: u32 = text.parse().expect("the count should be a number");
    println!("{count}");
}
```

```text
thread 'main' (29) panicked at src/main.rs:3:35:
the count should be a number: ParseIntError { kind: InvalidDigit }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

The message is your text followed by the debug form of the error. `unwrap()` does the same
without a text of your own.

## Your own error type

A function could report failure as a message in a `String`, but then callers would have to
compare text to tell problems apart. An enum that lists what can go wrong lets them `match`.

```rust
#[derive(Debug, PartialEq)]
enum OrderError {
    MissingQuantity,
    BadQuantity(String),
    TooMany(u32),
}

fn parse_quantity(text: &str) -> Result<u32, OrderError> {
    let text = text.trim();
    if text.is_empty() {
        return Err(OrderError::MissingQuantity);
    }
    let Ok(quantity) = text.parse::<u32>() else {
        return Err(OrderError::BadQuantity(text.to_string()));
    };
    if quantity > 500 {
        return Err(OrderError::TooMany(quantity));
    }
    Ok(quantity)
}

fn order_total(quantity: &str, price_cents: u32) -> Result<u32, OrderError> {
    let quantity = parse_quantity(quantity)?;
    Ok(quantity * price_cents)
}

fn main() {
    println!("{:?}", order_total(" 12 ", 250));
    println!("{:?}", order_total("a dozen", 250));
    println!("{:?}", order_total("", 250));
    println!("{:?}", order_total("9000", 250));
}
```

```text
Ok(3000)
Err(BadQuantity("a dozen"))
Err(MissingQuantity)
Err(TooMany(9000))
```

`parse_quantity` shows the usual shape of validation: check, leave early with
`return Err(...)`, carry on. The `let ... else` from lesson 11 replaces the library's error
with ours: when `parse` does not give `Ok`, the function returns `BadQuantity` with the
offending text. The success value has to be wrapped as well: the last line is `Ok(quantity)`,
not `quantity`. The `?` in `order_total` is the subject of the next section.

## Passing errors up with `?`

`order_total` cannot repair a bad quantity. It can only hand the problem to its own caller,
and the `?` after `parse_quantity(quantity)` does exactly that:

- On `Ok(value)`, the whole expression becomes `value`, and the function carries on.
- On `Err(error)`, the function **returns** that `Err` at once.

It is short for a `match` whose error arm is `Err(error) => return Err(error)`. It is only
allowed in a function that itself returns a `Result` with a matching error type. The Medium
level shows how `?` can also convert one error type into another.

## `?` on `Option`

```rust
fn port(address: &str) -> Option<u16> {
    let (_, port) = address.split_once(':')?;
    port.parse().ok()
}

fn main() {
    println!("{:?}", port("localhost:8080"));
    println!("{:?}", port("localhost"));
    println!("{:?}", port("localhost:http"));
}
```

```text
Some(8080)
None
None
```

In a function that returns an `Option`, `?` returns `None` early in the same way.
`split_once(':')` gives the text before and after the first colon as a pair inside `Some`, or
`None` when there is no colon. The two kinds do not mix. `parse` returns a `Result`, so
`.ok()` turns it into the `Option` this function promises. In the other direction, use
`.ok_or(error)`.

## When to panic

A panic says "this program has a bug". Keep it for that.

- **Return a `Result`** for anything that comes from outside the program: what a user typed,
  the content of a file, a reply from the network. Those failures are normal.
- **Return an `Option`** when a missing value is an ordinary answer, as in a lookup.
- **Panic** when going on would mean working with a state your code promised could not
  occur. `expect` is fine for a value you wrote yourself and know to be valid, and its text
  should say why. `unwrap` and `expect` are also at home in tests and quick experiments.

## Common mistakes

- **Calling `unwrap()` on input you do not control.** One malformed line then stops the whole
  program. Handle the `Err`.
- **Using `?` in a function that returns nothing.** In a plain `main`, the error is `E0277`:
  "the `?` operator can only be used in a function that returns `Result` or `Option`".
- **Using `?` on an `Option` inside a function that returns a `Result`.** The compiler tells
  you to write `.ok_or(...)?`.
- **Returning the bare value.** `quantity` where `Ok(quantity)` is needed gives "expected
  `Result<u32, OrderError>`, found `u32`" and the hint to wrap the expression in `Ok`.
- **Ignoring a `Result`.** Calling a fallible function and dropping its result produces the
  warning "unused `Result` that must be used".
- **Parsing without trimming.** `" 4".parse::<u32>()` is an `Err`.

## Practice

1. Write `parse_percent(text: &str) -> Result<u8, String>` that trims the text, parses it and
   rejects values above 100 with a message.
2. Write `first_number(text: &str) -> Option<u32>` that returns the number in front of the
   first comma, or `None` if there is no comma or no number there.
3. Choose `Option`, `Result` or a panic for each: looking up a customer by a number that may
   not exist, reading a settings file that may be missing, and reading a position in a list
   that your own code has just checked.

### Answers

**1.** and **2.** in one program:

```rust
fn parse_percent(text: &str) -> Result<u8, String> {
    let Ok(percent) = text.trim().parse::<u8>() else {
        return Err(format!("not a small whole number: {text}"));
    };
    if percent > 100 {
        return Err(format!("{percent} is more than 100"));
    }
    Ok(percent)
}

fn first_number(text: &str) -> Option<u32> {
    let (first, _) = text.split_once(',')?;
    first.trim().parse().ok()
}

fn main() {
    println!("{:?} {:?} {:?}", parse_percent(" 42 "), parse_percent("150"), parse_percent("x"));
    println!("{:?} {:?} {:?}", first_number("4, 5"), first_number("45"), first_number("x,1"));
}
```

```text
Ok(42) Err("150 is more than 100") Err("not a small whole number: x")
Some(4) None None
```

**3.** An `Option`, because an unknown customer is an ordinary answer. A `Result`, because the
caller needs to know why the file could not be read. Plain indexing, which panics, because a
wrong position there would be a bug in your own code.

## Key takeaways

- `Option` is for absence, `Result` is for failure with a reason, and a panic is for bugs.
- `match`, `unwrap_or` and `let ... else` handle a failure. `unwrap` and `expect` turn it
  into a panic.
- `?` returns early on `Err` or `None` and otherwise gives you the value inside.
- An error enum lets callers tell failures apart. Never `unwrap` a value that came from
  outside your program.

## Further reading

- [The Rust Programming Language: Recoverable Errors with Result](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)
- [The Rust Programming Language: To panic! or Not to panic!](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)
- [Standard library: Result](https://doc.rust-lang.org/std/result/enum.Result.html)
- [Standard library: Option](https://doc.rust-lang.org/std/option/enum.Option.html)
