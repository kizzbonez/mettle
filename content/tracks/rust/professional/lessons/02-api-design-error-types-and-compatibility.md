---
title: API Design, Error Types and Compatibility
summary: Write public interfaces that are easy to call, hard to misuse, and able to change without breaking the people who depend on them.
minutes: 35
objectives:
  - Choose parameter and return types that serve the caller
  - Implement an error type with `Display`, `Error::source` and `From`
  - Classify a change to a public API as major or minor under semantic versioning
  - Use `#[non_exhaustive]` and private fields to keep an API extensible
---

## Outline

1. Design for the caller
2. Errors are part of the API
3. What counts as a breaking change
4. Leaving room to grow

## Design for the caller

A public signature is a promise. Make it easy to call and hard to misuse.

- Accept the most general input: `&str` not `&String`, `&[T]` not `&Vec<T>`.
- Let lookups borrow. `HashMap<String, V>::get` takes `&str` through the `Borrow` trait, so
  callers never allocate just to ask a question.
- Encode rules in types. A `NonZeroUsize` capacity or a `UserId(u64)` newtype removes a class
  of bugs, and the documentation that warned about them.
- Derive `Debug`, `Clone` and `PartialEq` where they make sense. Your users cannot add them.

## Errors are part of the API

A library error should let the caller decide what to do, so it is an enum, not a string.

```rust
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
#[non_exhaustive]       // variants can be added in a minor release
pub enum ConfigError {
    MissingKey(String),
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

pub fn port(value: Option<&str>) -> Result<u16, ConfigError> {
    let text = value.ok_or_else(|| ConfigError::MissingKey("port".to_string()))?;
    Ok(text.trim().parse()?)
}
```

`Display` is for people, `source` exposes the cause, and `From` makes `?` work. Report a cause
in one of the two places, not both, or error reporters print it twice.

## What counts as a breaking change

Under semantic versioning, a change that can stop a user's code from compiling needs a new
major version. The ones that surprise people:

- adding a field to a struct whose fields are all public, because struct literals break;
- adding a variant to an ordinary enum, because exhaustive matches break;
- adding a trait method with no default body, because every implementor breaks;
- adding a generic method to a trait that people use as `dyn Trait`.

Adding functions, types and trait methods with default bodies is normally a minor change.

## Leaving room to grow

- `#[non_exhaustive]` forces other crates to write a wildcard arm and forbids struct
  literals, so variants and fields can be added later.
- Private fields with a constructor or builder do the same for configuration.
- Export less. Everything `pub` must be supported until the next major version.

## Key takeaways

- Take borrowed, general inputs and put the rules in the types.
- An error enum with `Display`, `source` and `From` serves both people and code.
- If it can break a downstream build, it is a major change.
- Plan for growth with `#[non_exhaustive]`, private fields and a small public surface.
