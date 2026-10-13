---
title: Writing and Organizing Tests
summary: Prove that code works with unit tests, integration tests and documentation tests, and run exactly the tests you want with `cargo test`.
minutes: 30
objectives:
  - Write unit tests with `assert!`, `assert_eq!` and `assert_ne!` and read a failure report
  - Test a panic with `#[should_panic]` and write a test that returns `Result`
  - Place integration tests in `tests/` and explain what they can and cannot reach
  - Run, filter and ignore tests from the command line
---

## Outline

1. A unit test
2. The assert macros
3. Panics and `Result` in tests
4. Integration tests
5. Documentation tests
6. Running and filtering tests

## A unit test

A **test** is a function that runs your code and panics if the result is wrong. Rust has
testing built in: mark a function with `#[test]`, run `cargo test`, and Cargo builds a special
executable that calls every marked function and reports each one.

A **unit test** checks one small piece in isolation and lives in the same file as the code. By
convention the tests sit in a nested module named `tests`.

```rust
// src/lib.rs
pub fn discounted(cents: u64, percent: u64) -> u64 {
    assert!(percent <= 100, "discount cannot exceed 100 percent, got {percent}");
    round_to_five(cents - cents * percent / 100)
}

pub fn parse_price(text: &str) -> Result<u64, std::num::ParseIntError> {
    text.trim().trim_start_matches('$').parse()
}

fn round_to_five(cents: u64) -> u64 {
    (cents + 2) / 5 * 5
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn takes_a_quarter_off() {
        assert_eq!(discounted(2000, 25), 1500);
    }

    #[test]
    fn rounds_a_private_helper() {
        assert_eq!(round_to_five(1232), 1230);
        assert_ne!(round_to_five(1233), 1230);
    }

    #[test]
    #[should_panic(expected = "cannot exceed 100")]
    fn rejects_a_discount_over_100() {
        discounted(2000, 150);
    }

    #[test]
    fn parses_a_dollar_price() -> Result<(), std::num::ParseIntError> {
        let cents = parse_price(" $450 ")?;
        assert_eq!(cents, 450);
        Ok(())
    }
}
```

```text
     Running unittests src/lib.rs (target/debug/deps/pricing-b296705f7da84bf1)

running 4 tests
test tests::parses_a_dollar_price ... ok
test tests::rejects_a_discount_over_100 - should panic ... ok
test tests::rounds_a_private_helper ... ok
test tests::takes_a_quarter_off ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

- `#[cfg(test)]` means "compile this module only when testing". The tests add nothing to a
  normal build.
- `use super::*;` brings everything from the parent module into scope. Because `tests` is a
  nested module, it can see its parent's private items, so `round_to_five` can be tested
  directly.
- Tests run in parallel, so the order of the lines can change from run to run.

## The assert macros

- `assert!(condition)` panics if the condition is false.
- `assert_eq!(left, right)` panics if the two differ, and `assert_ne!` if they are equal. Both
  print the two values, so the types must implement `PartialEq` and `Debug`. Derive them on
  your own types.
- All three accept a message with format arguments after the required ones. Use it to say
  what was being checked.

Change the expected value in the first test to `1400` and the report shows what happened:

```text
---- tests::takes_a_quarter_off stdout ----

thread 'tests::takes_a_quarter_off' (307) panicked at src/lib.rs:21:9:
assertion `left == right` failed
  left: 1500
 right: 1400
```

Read three things: the name of the test, the file and line of the assertion, and the two
values. `left` and `right` are simply the first and second argument.

## Panics and `Result` in tests

`#[should_panic]` reverses the rule: the test passes only if the code panics. On its own it is
satisfied by *any* panic, including one caused by a bug elsewhere. `expected = "..."` requires
the panic message to contain that text, which makes the test precise.

A test may also return `Result<(), E>`. It passes on `Ok(())` and fails on `Err`, which lets
the body use `?` instead of a chain of `unwrap` calls. To check that something returns an
error, do not use `?`; write `assert!(parse_price("free").is_err());`.

## Integration tests

An **integration test** uses your library the way another crate would. Each file in a `tests`
folder next to `src` is compiled as its own crate, so it sees only the `pub` items and must
import them by package name. No `#[cfg(test)]` is needed.

```rust
// tests/checkout.rs
use pricing::{discounted, parse_price};

#[test]
fn discount_applies_to_a_parsed_price() {
    let cents = parse_price("$2000").unwrap();
    assert_eq!(discounted(cents, 10), 1800);
}
```

```text
     Running tests/checkout.rs (target/debug/deps/checkout-199e78c5ac1e3334)

running 1 test
test discount_applies_to_a_parsed_price ... ok
```

Calling `pricing::round_to_five` here fails with E0603, "function `round_to_five` is private".
That is the point: unit tests check the parts, integration tests check the public surface.

Integration tests need a library crate. A package with only `src/main.rs` has nothing to
import, which is one more reason to keep `main.rs` thin and put the logic in `src/lib.rs`.
Helpers shared by several test files go in `tests/common/mod.rs`. A file `tests/common.rs`
would itself be run as a test file.

## Documentation tests

A comment that starts with `///` documents the item below it, in Markdown. Code blocks inside
it are compiled and run by `cargo test` as **documentation tests**, so an example in your
documentation cannot silently go stale.

```rust
/// Takes `percent` off a price in cents.
///
/// ```
/// assert_eq!(pricing::discounted(2000, 25), 1500);
/// ```
pub fn discounted(cents: u64, percent: u64) -> u64 {
```

```text
   Doc-tests pricing

running 1 test
test src/lib.rs - discounted (line 4) ... ok
```

A documentation test also uses the crate from outside, and Cargo runs them for library crates
only.

## Running and filtering tests

`cargo test` prints up to three sections: unit tests, one section for each integration test
file, and `Doc-tests`. Arguments before `--` go to Cargo; arguments after it go to the test
program.

```bash
cargo test                    # everything
cargo test quarter            # tests whose name contains "quarter"
cargo test tests::            # the module name is part of the test name
cargo test --test checkout    # only tests/checkout.rs
cargo test -- --show-output   # also show what passing tests print
cargo test -- --test-threads=1   # one at a time, for tests that share a file
cargo test -- --ignored       # only tests marked #[ignore]
```

```text
$ cargo test quarter
running 1 test
test tests::takes_a_quarter_off ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 3 filtered out; finished in 0.00s
```

Cargo's own status lines are left out of that excerpt. The output of a passing test is hidden
unless you ask for it. Mark a slow test with `#[ignore]` below `#[test]` and it is skipped by
default.

## Common mistakes

- **Leaving out `#[test]`.** The function is never run. The only hint is a warning that it is
  never used.
- **Tests that depend on each other or on order.** They run in parallel. Each test must set
  up what it needs.
- **`#[should_panic]` without `expected`.** It passes for the wrong panic too.
- **Testing only the happy path.** Add the empty input, the boundary value and the error case.
- **Importing with `crate::` in `tests/`.** An integration test is a different crate. Use the
  package name.

## Practice

1. Write a unit test showing that `discounted(999, 0)` returns `1000`, with a message on
   failure. Why 1000?
2. Which command runs only the tests in `tests/checkout.rs`? Which runs every test with
   `price` in its name?
3. Why can an integration test not call `round_to_five`?

### Answers

1. `assert_eq!(discounted(999, 0), 1000, "a zero discount still rounds to five");` inside a
   `#[test]` function. The price passes through `round_to_five`, and `(999 + 2) / 5 * 5` is
   1000 in integer arithmetic.
2. `cargo test --test checkout` and `cargo test price`.
3. It is compiled as a separate crate and sees only `pub` items. `round_to_five` is private,
   so only code inside the crate, such as the `tests` module, can reach it.

## Key takeaways

- `#[test]` functions pass unless they panic; `assert_eq!` shows both values when it fails.
- Unit tests live in `#[cfg(test)] mod tests` beside the code and can test private items.
- Files in `tests/` are separate crates that exercise the public API; `///` examples are
  tested too.
- `cargo test NAME` filters by name, and options after `--` go to the test program.

## Further reading

- [The Rust Programming Language: How to Write Tests](https://doc.rust-lang.org/book/ch11-01-writing-tests.html)
- [The Rust Programming Language: Test Organization](https://doc.rust-lang.org/book/ch11-03-test-organization.html)
- [The Cargo Book: cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html)
- [The rustdoc Book: Documentation tests](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html)
