---
title: Testing and Verification at Scale
summary: Go beyond hand-picked test cases with property-based testing, fuzzing, Miri and sanitizers, and put the checks that matter into continuous integration.
minutes: 25
objectives:
  - State a property of a function and test it against generated inputs
  - Explain how fuzzing differs from property-based testing and when each fits
  - Say which class of bug Miri, AddressSanitizer and ThreadSanitizer each detect
  - Assemble a CI pipeline with `fmt`, Clippy, tests and a minimum supported Rust version
---

## Outline

1. The limits of example tests
2. Property-based testing
3. Fuzzing
4. Miri and sanitizers
5. What belongs in CI

## The limits of example tests

A unit test checks the inputs you thought of. Bugs live in the ones you did not. Each
technique in this lesson generates inputs, or watches executions, in a way that does not
depend on your imagination. They cost machine time and tooling, so aim them where a bug is
expensive: parsers, encoders, data structures and unsafe code.

## Property-based testing

A **property** is a statement that must hold for every valid input: "decoding an encoding
gives back the original", "the output is sorted". A **property-based test** generates many
inputs and checks the property on each one.

```rust
/// Run-length encoding: `[7, 7, 7, 2]` becomes `[(7, 3), (2, 1)]`.
pub fn encode(input: &[u8]) -> Vec<(u8, usize)> {
    let mut runs: Vec<(u8, usize)> = Vec::new();
    for &byte in input {
        match runs.last_mut() {
            Some((last, count)) if *last == byte => *count += 1,
            _ => runs.push((byte, 1)),
        }
    }
    runs
}

pub fn decode(runs: &[(u8, usize)]) -> Vec<u8> {
    runs.iter().flat_map(|&(byte, count)| std::iter::repeat_n(byte, count)).collect()
}

/// A tiny deterministic generator (xorshift): the seed replays a failure.
struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }
}

fn main() {
    for seed in 1..=500_u64 {
        let mut rng = Rng(seed);
        let len = (rng.next() % 40) as usize;
        // Three possible byte values, so that long runs are common.
        let input: Vec<u8> = (0..len).map(|_| (rng.next() % 3) as u8).collect();

        let runs = encode(&input);
        assert_eq!(decode(&runs), input, "round trip failed, seed {seed}");
        assert!(
            runs.windows(2).all(|pair| pair[0].0 != pair[1].0),
            "two neighbouring runs hold the same byte, seed {seed}"
        );
    }
    println!("500 cases passed");
}
```

```text
500 cases passed
```

Four kinds of property cover most code:

- **Round trip**: `decode(encode(x)) == x`.
- **Invariant of the output**: neighbouring runs never hold the same byte.
- **Model**: the result equals that of a simple, obviously correct version, for example a
  cache compared with a plain `Vec` that is scanned linearly.
- **Idempotence**: doing it twice equals doing it once.

The generator matters as much as the property. Random bytes from all 256 values would almost
never form a run, and the test would check very little.

The loop above lacks two things that the `proptest` crate provides. **Strategies** are
composable descriptions of how to generate values: ranges, collections, strings matching a
regular expression. **Shrinking** searches, after a failure, for a smaller input that still
fails, so you debug two bytes, not forty. This version needs the crate and does not run in
the sandbox:

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn round_trips(input in proptest::collection::vec(0u8..3, 0..40)) {
        prop_assert_eq!(decode(&encode(&input)), input);
    }
}
```

By default each such test runs 256 cases. A failing case is saved under
`proptest-regressions`, and the proptest documentation says to commit those files so that the
case is replayed on every later run.

## Fuzzing

A **fuzzer** also feeds generated input to your code, but it is **coverage-guided**: it
watches which branches each input reaches, keeps the inputs that reach new code (the
**corpus**) and mutates them. It works on raw bytes and runs for minutes or days. That suits
code that must survive hostile input. `cargo-fuzz` drives the libFuzzer engine and needs a
nightly toolchain, so this target does not run in the sandbox either:

```rust
// fuzz/fuzz_targets/round_trip.rs, created by `cargo fuzz add round_trip`
#![no_main]
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    assert_eq!(decode(&encode(data)), data);
});
```

`cargo fuzz run round_trip` runs until the target panics or crashes, then saves the input
under `fuzz/artifacts/`. Passing that file to the same command replays it.

The two techniques complement each other. Property tests are fast, take structured input and
run with `cargo test` on every change. Fuzzing is slow, explores deeper and is usually
scheduled. Turn every fuzzer finding into an ordinary unit test.

## Miri and sanitizers

These tools generate nothing. They watch an execution for errors that would otherwise stay
silent.

- **Miri** interprets Rust code and detects undefined behaviour, including aliasing
  violations and reads of uninitialized memory. It cannot run most foreign code and is slow.
- **Sanitizers** are checks the compiler inserts into native code. C code built with the
  same sanitizer is covered too. AddressSanitizer finds out-of-bounds access, use after free,
  double free and leaks. ThreadSanitizer finds data races. MemorySanitizer finds reads of
  uninitialized memory.

Both need a nightly toolchain:

```bash
cargo +nightly miri test
RUSTFLAGS=-Zsanitizer=address cargo +nightly run -Zbuild-std --target x86_64-unknown-linux-gnu
```

All of them report only what happens on the paths your tests execute. They multiply the
value of a test suite. They do not replace it.

## What belongs in CI

**Continuous integration** (CI) runs the same checks on every proposed change, so the main
branch always passes them. A sound baseline:

```bash
cargo fmt --all -- --check       # fails if rustfmt would change any file
cargo clippy --all-targets --all-features -- -D warnings   # lints, warnings as errors
cargo test --locked              # tests, with the exact versions in Cargo.lock
cargo +1.85 check --locked       # still builds on the declared minimum Rust version
```

The **minimum supported Rust version** (MSRV) is the oldest compiler you promise to build
with. Declaring it in `Cargo.toml` makes Cargo refuse an older compiler with a clear message:

```toml
[package]
rust-version = "1.85"
```

Nothing keeps that promise true except a CI job that builds with exactly that version.

Two trade-offs. Denying warnings means a new compiler or Clippy release, with new lints, can
fail a build that was green yesterday. Pin the toolchain in `rust-toolchain.toml` and upgrade
on purpose. And slow checks, such as fuzzing or Miri over a large suite, belong in a
scheduled job, not in every pull request.

## Common mistakes

- **A property that repeats the implementation.** It tests the code against itself.
- **A generator that cannot reach the interesting inputs.** See the first exercise.
- **Not recording the seed or the failing case.** A failure you cannot replay is lost.
- **Reading a clean Miri or sanitizer run as proof.** It covers only what ran.
- **An MSRV with no CI job.** It will be wrong within a few releases.
- **`#![deny(warnings)]` in the source.** It breaks the build for anyone who compiles your
  crate with a newer compiler that adds a warning. Deny warnings in CI.

## Practice

1. A variant of `encode` stores each count in a `u8` and increments it with `wrapping_add`.
   Why do all 500 cases above still pass? Which input exposes the bug?
2. State three properties of sorting a `Vec<u32>` that together pin down a correct sort.
3. Pick a tool for each: (a) a data race behind an `unsafe impl Sync`; (b) a C library you
   call writes past a buffer; (c) a parser panics on some malformed input nobody has seen;
   (d) two live `&mut` to one value in pure Rust unsafe code.

### Answers

1. A count overflows only on a run longer than 255, and the generator never builds an input
   longer than 39 bytes. An input of 256 equal bytes exposes it: the count wraps to 0 and the
   decoded output is empty. Generate lengths past 255, or let a fuzzer find the length.
2. The output is ordered (`pair[0] <= pair[1]` for every neighbouring pair). The output is a
   rearrangement of the input: same length, and every value occurs equally often in both.
   Sorting the output again changes nothing. Ordered alone is not enough, because a function
   that returns an empty vector passes it.
3. (a) ThreadSanitizer, or Miri if the test runs under it. (b) AddressSanitizer, with the C
   library built with it too, since Miri does not interpret C. (c) A fuzzer. (d) Miri, whose
   aliasing checks exist for this.

## Key takeaways

- A property plus a good generator checks inputs you would not have written by hand.
- Shrinking and a saved failing case turn a random failure into a repeatable one.
- Fuzzing is coverage-guided and slow, and suits code that reads untrusted bytes.
- Miri and sanitizers reveal silent errors, but only on the paths your tests run.
- CI baseline: format check, Clippy with warnings denied, tests with `--locked`, and an MSRV
  job.

## Further reading

- [The Cargo Book: Rust version](https://doc.rust-lang.org/cargo/reference/rust-version.html)
- [Clippy documentation: Continuous integration](https://doc.rust-lang.org/clippy/continuous_integration/index.html)
- [The proptest book: Getting started](https://proptest-rs.github.io/proptest/proptest/getting-started.html)
- [The Rust Fuzz Book: cargo-fuzz tutorial](https://rust-fuzz.github.io/book/cargo-fuzz/tutorial.html)
