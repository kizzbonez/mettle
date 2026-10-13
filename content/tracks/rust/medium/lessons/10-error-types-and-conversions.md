---
title: Error Types and Conversions
summary: Design an error type that callers can act on, let the `?` operator convert errors for you, and write conversions that are allowed to fail.
minutes: 30
objectives:
  - Define an error enum and implement `Display` and `std::error::Error` for it
  - Explain how `?` uses `From` to convert one error type into another
  - Decide between a custom error type and `Box<dyn Error>`
  - Implement `TryFrom` and `FromStr` for conversions that can fail
---

## Outline

1. Why define an error type
2. An error enum, step by step
3. How `?` converts errors
4. `Box<dyn Error>`: any error at all
5. Conversions that can fail: `TryFrom` and `FromStr`

## Why define an error type

The Basic level returned errors as `Result<T, String>` or passed a library's error along with
`?`. A `String` is fine for a message that only a person reads. It is a poor answer for a
caller that wants to *react*, because the only way to tell two failures apart is to compare
text. An enum with one variant per kind of failure lets callers `match`, and lets the compiler
check that they handled every case.

## An error enum, step by step

A good error type does four things: it derives `Debug`, implements `Display` for the message,
implements the trait `std::error::Error`, and offers `From` conversions from the errors
it wraps.

```rust
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
enum SumError {
    Empty,
    Parse(ParseIntError),
}

impl fmt::Display for SumError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SumError::Empty => write!(f, "no numbers given"),
            SumError::Parse(inner) => write!(f, "not a whole number: {inner}"),
        }
    }
}

impl Error for SumError {}

impl From<ParseIntError> for SumError {
    fn from(inner: ParseIntError) -> SumError {
        SumError::Parse(inner)
    }
}

fn sum(text: &str) -> Result<i64, SumError> {
    if text.trim().is_empty() {
        return Err(SumError::Empty);
    }
    let mut total = 0;
    for part in text.split(',') {
        total += part.trim().parse::<i64>()?; // ParseIntError becomes SumError
    }
    Ok(total)
}

fn main() {
    println!("{:?}", sum("4, 5, 6"));
    for input in ["", "4, five"] {
        match sum(input) {
            Ok(total) => println!("{total}"),
            Err(SumError::Empty) => println!("nothing to add"),
            Err(other) => println!("error: {other}"),
        }
    }
}
```

```text
Ok(15)
nothing to add
error: not a whole number: invalid digit found in string
```

- `Parse(ParseIntError)` wraps the underlying error instead of throwing it away, so no detail
  is lost.
- The `Error` trait requires `Debug` and `Display`, and all its own methods have defaults. That
  is why `impl Error for SumError {}` has an empty body. Implementing it is what lets your type
  work with everything that handles errors in general.
- By convention an error message is a short lowercase phrase with no full stop.

## How `?` converts errors

`sum` returns `SumError`, yet `parse` fails with a `ParseIntError`. The line with `?` still
compiles because `?` does more than return early. On an `Err(e)` it returns
`Err(From::from(e))`: it converts the error into the function's error type through the `From`
trait. The `impl From<ParseIntError> for SumError` above is that conversion. Delete it and the
compiler explains the mechanism itself:

```text
error[E0277]: `?` couldn't convert the error to `SumError`
  --> src/main.rs:28:44
   |
22 | fn sum(text: &str) -> Result<i64, SumError> {
   |                       --------------------- expected `SumError` because of this
...
28 |         total += part.trim().parse::<i64>()?; // ParseIntError becomes SumError
   |                              --------------^ the trait `From<ParseIntError>` is not implemented for `SumError`
   |                              |
   |                              this can't be annotated with `?` because it has type `Result<_, ParseIntError>`
```

Read it as: this expression produces a `ParseIntError`, the function promised a `SumError`,
and no `From` joins the two. Write one `From` per wrapped error and each `?` stays a single
character.

## `Box<dyn Error>`: any error at all

Sometimes you do not want to design an error type: in `main`, in a small tool, in an early
draft. `Box<dyn Error>` means "a pointer to some value that implements `Error`". The standard
library can convert any error type into it, and also a `&str` or a `String`, so `?` works on
everything.

```rust
use std::error::Error;
use std::fs;

fn first_number(path: &str) -> Result<i64, Box<dyn Error>> {
    let text = fs::read_to_string(path)?;                       // io::Error
    let line = text.lines().next().ok_or("the file is empty")?; // &str
    let number = line.trim().parse::<i64>()?;                   // ParseIntError
    Ok(number)
}

fn main() {
    match first_number("missing.txt") {
        Ok(number) => println!("{number}"),
        Err(error) => println!("error: {error}"),
    }
}
```

```text
error: No such file or directory (os error 2)
```

`fs::read_to_string` reads a whole file into a `String`; the wording of its error comes from
the operating system. `ok_or(e)` turns `None` into `Err(e)`. Three different error types pass
through three `?` operators with no extra code. The price: the caller receives "some error"
and can do little except print it. Use `Box<dyn Error>` in applications, and an enum in a
library, where callers need to tell cases apart.

## Conversions that can fail: `TryFrom` and `FromStr`

`From` is for conversions that always succeed. Two sibling traits return a `Result` instead.

- `TryFrom<T>` converts from a value of type `T`. Its associated type `Error` says what a
  failure looks like. Implementing it also gives the other side `try_into()`.
- `FromStr` converts from text. Its associated type is named `Err`. It is the trait behind
  `str::parse`, so implementing it makes `"...".parse::<YourType>()` work.

```rust
use std::str::FromStr;

#[derive(Debug)]
struct Percent(u8);

impl TryFrom<i32> for Percent {
    type Error = String;

    fn try_from(value: i32) -> Result<Percent, String> {
        match u8::try_from(value) {
            Ok(small) if small <= 100 => Ok(Percent(small)),
            _ => Err(format!("{value} is not between 0 and 100")),
        }
    }
}

impl FromStr for Percent {
    type Err = String;

    fn from_str(text: &str) -> Result<Percent, String> {
        let digits = text.trim_end_matches('%');
        let number: i32 = digits.parse().map_err(|_| format!("`{text}` is not a number"))?;
        Percent::try_from(number)
    }
}

fn main() {
    println!("{:?}", Percent::try_from(140));
    println!("{:?}", "85%".parse::<Percent>());
    println!("{:?}", "lots".parse::<Percent>());

    let half: Percent = "50".parse().unwrap();
    println!("{} {} {}", half.0, u8::try_from(300_i32).is_err(), 300_i32 as u8);
}
```

```text
Err("140 is not between 0 and 100")
Ok(Percent(85))
Err("`lots` is not a number")
50 true 44
```

`map_err` replaces the error inside a `Result` and leaves an `Ok` alone. The last line shows
why `TryFrom` exists: `300 as u8` silently keeps the low eight bits and gives 44, while
`u8::try_from(300)` reports the problem. Keep the field of `Percent` private, and code outside
its module can only build one through `try_from` or `parse`, so no invalid value can exist.

## Common mistakes

- **Using `?` with no conversion.** The error type of the expression must be the function's
  error type or have a `From` into it.
- **Forgetting `impl Error`.** Without it, `?` cannot turn your type into a `Box<dyn Error>`,
  and the compiler says the trait `std::error::Error` is not implemented.
- **Returning `Box<dyn Error>` from a library.** Callers cannot `match` on it.
- **Converting with `as` and hoping.** `as` between integer types never fails; it truncates.
  Use `try_from` when the value may not fit.
- **Writing a `From` that can panic.** If it can fail, it is a `TryFrom`.

## Practice

1. Add a variant `TooLarge(i64)` to `SumError`, returned when the total exceeds 1000. What else
   must change?
2. Implement `TryFrom<u8>` for `struct Month(u8)`, accepting 1 to 12.
3. In a function returning `Result<(), Box<dyn Error>>`, how do you fail with the message
   "bad input"?

### Answers

1. Add an arm to the `match` in `Display`; the compiler insists, because the match must be
   exhaustive. Then return `Err(SumError::TooLarge(total))` from `sum`. No new `From` is
   needed, since nothing is being converted.
2. Set `type Error = String;` and write the body of `try_from` as
   `if (1..=12).contains(&value) { Ok(Month(value)) } else { Err(format!("{value} is not a month")) }`.
3. `return Err("bad input".into());`. `into()` turns the `&str` into a `Box<dyn Error>`
   through the same `From` that `?` uses.

## Key takeaways

- An error enum lets callers match on what went wrong; implement `Display` and `Error` for it.
- `?` returns `Err(From::from(e))`, so one `From` per wrapped error keeps the code short.
- `Box<dyn Error>` accepts any error and suits applications; libraries should use their own
  types.
- `TryFrom` and `FromStr` are the conversions that may fail, and `parse` is `FromStr` in
  disguise.

## Further reading

- [Standard library: the `Error` trait](https://doc.rust-lang.org/std/error/trait.Error.html)
- [Standard library: the `From` trait](https://doc.rust-lang.org/std/convert/trait.From.html)
- [Standard library: the `TryFrom` trait](https://doc.rust-lang.org/std/convert/trait.TryFrom.html)
- [Rust by Example: Wrapping errors](https://doc.rust-lang.org/rust-by-example/error/multiple_error_types/wrap_error.html)
