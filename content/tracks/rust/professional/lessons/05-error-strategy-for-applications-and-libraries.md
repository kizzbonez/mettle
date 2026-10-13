---
title: Error Strategy for Applications and Libraries
summary: Give library callers typed errors they can act on, give application users a readable chain of causes, and keep panics for bugs.
minutes: 25
objectives:
  - Explain why a library returns a typed error and an application usually returns an opaque one
  - Implement `Display`, `Error::source` and `From` by hand for an error enum
  - Add context to an error and print the whole chain of causes
  - Decide between `Result` and a panic, and capture a backtrace when one is needed
---

## Outline

1. Two audiences
2. A library error by hand
3. Context and the chain of causes
4. When a panic is correct
5. Exit codes and backtraces

## Two audiences

An error is read by code and by people, and the two want different things.

A **library** cannot know what its caller will do about a failure: retry, fall back, ask the
user. So it returns a specific type the caller can `match` on, usually an enum with one
variant per situation a caller might treat differently.

An **application** is the end of the line. Most of its errors are only logged or shown, so
one opaque type that can hold any error is enough:
`Box<dyn Error + Send + Sync + 'static>`. `Send + Sync` lets the error cross threads, and
`'static` allows it to be downcast back to its concrete type.

Two widely used crates automate this split: `thiserror` derives the library side and `anyhow`
supplies the application side. This course's sandbox has only the standard library, so the
code below writes by hand what those crates generate.

## A library error by hand

```rust
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
#[non_exhaustive]
pub enum ConfigError {
    MissingKey(&'static str),
    BadPort(ParseIntError),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::MissingKey(key) => write!(f, "missing key `{key}`"),
            ConfigError::BadPort(_) => write!(f, "port is not a valid number"),
        }
    }
}

impl Error for ConfigError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ConfigError::BadPort(cause) => Some(cause),
            ConfigError::MissingKey(_) => None,
        }
    }
}

impl From<ParseIntError> for ConfigError {
    fn from(cause: ParseIntError) -> Self {
        ConfigError::BadPort(cause)
    }
}

pub fn parse_port(value: Option<&str>) -> Result<u16, ConfigError> {
    let text = value.ok_or(ConfigError::MissingKey("port"))?;
    Ok(text.trim().parse()?) // `?` calls `From<ParseIntError>`
}
```

Three traits do three jobs. `Display` is the message for people. By convention it is
lowercase with no full stop, so that it reads well inside a longer line. `Error::source`
exposes the underlying cause, which lets a reporter walk the chain. `From` lets `?` convert
the low-level error on the way out.

Put a cause in `source` **or** in the `Display` text, never both, or a reporter that prints
the chain shows it twice.

## Context and the chain of causes

"invalid digit found in string" is true and useless. Which string? A low-level error does not
know what the program was trying to do. Each layer that does know adds **context**: it wraps
the error in a new one whose message names the attempt and whose `source` is the original.
The next block continues the same file.

```rust
type AppError = Box<dyn Error + Send + Sync + 'static>;

#[derive(Debug)]
struct Context {
    message: String,
    source: AppError,
}

impl fmt::Display for Context {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl Error for Context {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(self.source.as_ref())
    }
}

fn start(service: &str, port: Option<&str>) -> Result<u16, AppError> {
    let port = parse_port(port).map_err(|cause| Context {
        message: format!("cannot start `{service}`"),
        source: cause.into(),
    })?;
    Ok(port)
}

/// Prints an error and every cause behind it, outermost first.
fn report(error: &(dyn Error + 'static)) {
    println!("error: {error}");
    let mut cause = error.source();
    while let Some(inner) = cause {
        println!("  caused by: {inner}");
        cause = inner.source();
    }
}

fn main() {
    println!("{:?}", start("billing", Some(" 8080 ")));
    for port in [Some("80a"), None] {
        if let Err(error) = start("billing", port) {
            report(error.as_ref());
        }
    }
}
```

```text
Ok(8080)
error: cannot start `billing`
  caused by: port is not a valid number
  caused by: invalid digit found in string
error: cannot start `billing`
  caused by: missing key `port`
```

`anyhow` packages the `map_err` as a `.context("...")` method on `Result`, and its error type
prints the chain much as `report` does. The typed error is not lost inside the box:
`error.source()` followed by `downcast_ref::<ConfigError>()` gets it back for code that needs
to branch on it.

## When a panic is correct

A `Result` says "this can fail, and here is how to tell". A panic says "this program has a
bug". Panic when:

- an invariant or documented precondition is broken, such as an index past the end. List the
  conditions under a `# Panics` heading in the documentation;
- you know more than the compiler: `"127.0.0.1".parse().expect("literal is a valid address")`.
  The `expect` message states why failure is impossible;
- the code is a test or a prototype.

Return a `Result` for everything that can happen in a correct program: bad input, a missing
file, a full disk, a dropped connection. The trade-off is asymmetric. A caller can turn an
`Err` into a panic with one `expect`, but cannot cheaply turn a panic back into a value. A
library that panics on bad input has taken the decision away from its caller.

## Exit codes and backtraces

An error value says what went wrong, not where. A **backtrace** is the list of function calls
that were active at one moment. Panics print one when `RUST_BACKTRACE=1` is set. An error
value can record one with `Backtrace::capture()` at the point where it is created.

```rust
use std::backtrace::{Backtrace, BacktraceStatus};
use std::process::ExitCode;

#[derive(Debug)]
struct Failure {
    message: &'static str,
    trace: Backtrace,
}

fn load() -> Result<u32, Failure> {
    // Cheap unless RUST_BACKTRACE or RUST_LIB_BACKTRACE asks for a trace.
    Err(Failure { message: "index file is corrupt", trace: Backtrace::capture() })
}

fn main() -> ExitCode {
    match load() {
        Ok(count) => {
            println!("{count} entries");
            ExitCode::SUCCESS
        }
        Err(failure) => {
            println!("error: {}", failure.message);
            let captured = failure.trace.status() == BacktraceStatus::Captured;
            println!("backtrace captured: {captured}");
            ExitCode::from(2)
        }
    }
}
```

```text
error: index file is corrupt
backtrace captured: false
```

The process exits with status 2. Run with `RUST_BACKTRACE=1` and the last line says `true`.
Printing `failure.trace` then lists the frames, starting with `load`.
`RUST_LIB_BACKTRACE` overrides `RUST_BACKTRACE` for `capture`, so traces for errors can be
switched separately from traces for panics. Capturing is expensive, and frames show file
names and line numbers only when the binary carries debug information. Capture once, where
the error is born, not at every layer.

Returning `ExitCode` from `main` keeps control of the output. If `main` returns
`Result<(), E>` instead, an `Err` is printed with `{:?}`, the `Debug` form, and the exit
status is 1.

## Common mistakes

- **`String` as a library's error type.** Callers can only compare text, and every rewording
  breaks them.
- **The cause in both `Display` and `source`.** It is printed twice.
- **Dropping the cause** with `map_err(|_| MyError::Failed)`. The one fact needed to debug the
  failure is gone.
- **Logging an error and returning it too.** Every layer then reports the same failure.
  Handle it or pass it up.
- **`unwrap()` on input, files or the network.** Those failures are expected, so they are not
  bugs.
- **`Box<dyn Error>` without `Send + Sync`** in an application. It cannot leave the thread
  that made it.

## Practice

1. `parse_port` accepts `"0"`. Add a variant `ZeroPort` and return it for a zero port. Which
   implementations change? Is this a breaking change for other crates?
2. Decide between a panic and a `Result`: (a) the configuration file is missing at start-up;
   (b) an index your own code computed is past the end of a vector; (c) a user typed letters
   into a number field.
3. A program's `main` returns `Result<(), Box<dyn Error>>` and fails with an error whose
   `Display` text is `cannot reach db.internal`. Why does the terminal show
   `Error: Offline { host: "db.internal" }`, and how do you show the readable message?

### Answers

1. Add `ZeroPort` to the enum, give `Display` an arm for it that writes
   `port must not be zero`, and add it to the `None` arm of `source`. In `parse_port`, parse
   into a variable and return `Err(ConfigError::ZeroPort)` when it is 0. `From` does not
   change. It is not breaking: the enum is `#[non_exhaustive]`, so other crates already have
   a wildcard arm.
2. (a) `Result`: a missing file happens in correct programs, and `main` can report it and
   exit. (b) Panic: the program's own logic is wrong, and continuing would hide the bug.
   (c) `Result`: wrong input is the normal case for input.
3. The runtime prints the error returned from `main` with `{:?}`, so it shows the derived
   `Debug` output. Handle the error yourself: call a function such as `report`, which uses
   `Display` and walks `source()`, then return `ExitCode::FAILURE`.

## Key takeaways

- Libraries return typed errors for code to match on. Applications return one opaque,
  thread-safe error type.
- `Display` for the message, `source` for the cause, `From` for `?`.
- Add context at each layer that knows what was being attempted, and print the chain at the
  top.
- `Result` for what can happen in a correct program, a panic for a bug.
- Capture a backtrace once, at creation, and only when the environment asks for it.

## Further reading

- [Standard library: the `Error` trait](https://doc.rust-lang.org/std/error/trait.Error.html)
- [The Rust Programming Language: To panic! or Not to panic!](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)
- [Standard library: `std::backtrace`](https://doc.rust-lang.org/std/backtrace/index.html)
- [The `anyhow` crate](https://docs.rs/anyhow/latest/anyhow/)
