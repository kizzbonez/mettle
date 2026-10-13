---
title: Error Handling with Option and Result
summary: Express absence and failure as ordinary values, propagate them with one character, and keep panics for bugs.
minutes: 25
objectives:
  - Choose between `Option`, `Result` and a panic for a given situation
  - Propagate errors with `?` and explain what it expands to
  - Define an error enum and convert other errors into it with `From`
---

## Outline

1. Absence and failure are values
2. Handling them
3. Propagating with `?`
4. Your own error type
5. When to panic

## Absence and failure are values

Rust has no `null` and no exceptions. Two enums from the standard library take their place:

- `Option<T>` is `Some(value)` or `None`. Use it when a missing value is normal: a lookup, the
  first element of a list.
- `Result<T, E>` is `Ok(value)` or `Err(error)`. Use it when something can fail and the caller
  should learn why.

Because both are ordinary types, a function's signature tells you whether it can fail, and the
compiler will not let you use the value without dealing with the other case.

## Handling them

`match` always works. For common cases there are methods: `unwrap_or(default)` supplies a
fallback, `map` transforms the success value, `ok_or(error)` turns an `Option` into a `Result`,
and `ok()` turns a `Result` into an `Option`.

`unwrap()` and `expect("reason")` panic on `None` or `Err`. They belong in tests and in places
where failure would mean a bug in your own code, not on input you do not control.

## Propagating with `?`

Most functions cannot fix an error; they pass it to their caller. The `?` operator does that:
on `Ok(v)` it evaluates to `v`, and on `Err(e)` it returns `Err(e.into())` from the function at
once. It works the same way on `Option` inside a function that returns `Option`.

## Your own error type

An enum lists everything that can go wrong. Implementing `From` lets `?` convert a lower-level
error into yours.

```rust
use std::num::ParseIntError;

#[derive(Debug, PartialEq)]
enum ConfigError {
    Missing(&'static str),
    BadNumber(ParseIntError),
}

impl From<ParseIntError> for ConfigError {
    fn from(err: ParseIntError) -> Self {
        ConfigError::BadNumber(err)
    }
}

fn port(line: &str) -> Result<u16, ConfigError> {
    let (_, value) = line.split_once('=').ok_or(ConfigError::Missing("="))?;
    let port = value.trim().parse::<u16>()?;    // converted through From
    Ok(port)
}

fn main() {
    assert_eq!(port("port = 8080"), Ok(8080));
    assert_eq!(port("port 8080"), Err(ConfigError::Missing("=")));
    assert!(matches!(port("port = http"), Err(ConfigError::BadNumber(_))));
}
```

Callers can now `match` on the variant and react differently to each failure, which a plain
error string would not allow.

## When to panic

A panic means "this program has a bug". Indexing past the end of a slice panics because no
caller could sensibly recover. Bad user input, a missing file and a refused connection are not
bugs. They are expected, so they are a `Result`.

## Key takeaways

- `Option` is for absence, `Result` is for failure with a reason, and a panic is for bugs.
- `?` returns early on `None` or `Err` and converts the error with `From`.
- An error enum lets callers tell failures apart.
- Never `unwrap` a value that came from outside your program.
