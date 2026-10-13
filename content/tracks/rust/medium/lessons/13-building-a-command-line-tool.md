---
title: Building a Command-Line Tool
summary: Put the whole level to work in one small program that reads its arguments and a file, keeps its logic testable, and fails the way a good tool should.
minutes: 30
objectives:
  - Read command-line arguments with `std::env::args` and a file with `fs::read_to_string`
  - Split a program into a thin `main.rs` and a testable `lib.rs`
  - Report errors on standard error with `eprintln!`, not on standard output
  - Return a meaningful exit code from `main` with `ExitCode`
---

## Outline

1. The plan
2. A first attempt
3. The library: configuration and logic
4. The binary: messages and exit codes
5. Why standard error matters

## The plan

`topwords` prints the most frequent words in a text file:

```text
$ topwords notes.txt 2
  4 the
  3 fox
```

It takes a file path and an optional count, which defaults to 3. Nothing here is new. The
interesting part is how modules, iterators, collections, errors and tests fit together. Create
the package with `cargo new topwords`, and a file `notes.txt` beside `Cargo.toml` with two
lines: "The quick brown fox jumps over the lazy dog." and "The dog barks; the fox runs. A quick
fox!".

## A first attempt

`std::env::args()` returns an iterator over the arguments as `String` values. The first item
is traditionally the path of the program itself, so the real arguments begin at index 1.

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    println!("{args:?}");

    let path = &args[1];
    println!("reading {path}");
}
```

```text
$ cargo run --quiet -- notes.txt 5
["target/debug/topwords", "notes.txt", "5"]
reading notes.txt
$ cargo run --quiet
["target/debug/topwords"]

thread 'main' (67) panicked at src/main.rs:7:21:
index out of bounds: the len is 1 but the index is 1
```

It works until someone forgets an argument. Then the user gets a panic about indexes, which
is a message for the programmer. A panic is right for a bug. A missing argument is not a bug;
it is an ordinary event that deserves an ordinary message.

There is a second problem: everything lives in `main`, and `main` cannot be called from a
test.

## The library: configuration and logic

The cure for both is the layout from the first lesson of this level. `src/lib.rs` holds every
decision and returns `Result`. `src/main.rs` only talks to the outside world.

```rust
// src/lib.rs
use std::collections::BTreeMap;
use std::error::Error;
use std::fs;

pub struct Config {
    pub path: String,
    pub count: usize,
}

impl Config {
    pub fn build(mut args: impl Iterator<Item = String>) -> Result<Config, String> {
        args.next(); // skip the program name
        let path = args.next().ok_or("no file given")?;
        let count = match args.next() {
            Some(text) => text.parse().map_err(|_| format!("`{text}` is not a count"))?,
            None => 3,
        };
        Ok(Config { path, count })
    }
}

pub fn top_words(text: &str, count: usize) -> Vec<(String, usize)> {
    let mut counts: BTreeMap<String, usize> = BTreeMap::new();
    for word in text.split_whitespace() {
        let word = word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
        if !word.is_empty() {
            *counts.entry(word).or_insert(0) += 1;
        }
    }
    let mut pairs: Vec<(String, usize)> = counts.into_iter().collect();
    pairs.sort_by(|a, b| b.1.cmp(&a.1)); // stable, so ties stay alphabetical
    pairs.truncate(count);
    pairs
}

pub fn run(config: &Config) -> Result<(), Box<dyn Error>> {
    let text = fs::read_to_string(&config.path)
        .map_err(|error| format!("cannot read {}: {error}", config.path))?;
    for (word, n) in top_words(&text, config.count) {
        println!("{n:>3} {word}");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counting_ignores_case_and_punctuation() {
        let top = top_words("The cat. the CAT! A dog?", 2);
        assert_eq!(top, [(String::from("cat"), 2), (String::from("the"), 2)]);
    }

    #[test]
    fn the_count_is_optional() {
        let args = ["topwords", "notes.txt"].into_iter().map(String::from);
        assert_eq!(Config::build(args).unwrap().count, 3);
    }
}
```

```text
running 2 tests
test tests::counting_ignores_case_and_punctuation ... ok
test tests::the_count_is_optional ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

That is the unit-test section of `cargo test`. Each piece has one job.

- **`Config::build`** turns raw arguments into a checked value. It accepts *any* iterator of
  `String`, so the program passes `env::args()` and a test passes an array. It is called
  `build`, not `new`, because by convention `new` does not fail. `ok_or` turns the `Option`
  from `next` into a `Result`, and `?` converts its `&str` error into the `String` the function
  returns.
- **`top_words`** is the logic: text in, data out. It never touches a file or prints, which
  is why the first test can call it with a literal. The `BTreeMap`
  yields words in alphabetical order and the stable sort keeps that order among equal counts,
  so the result is the same on every run.
- **`run`** connects the two. `map_err` adds the file name to the error, because "No such file"
  alone does not say *which* file.

## The binary: messages and exit codes

```rust
// src/main.rs
use std::env;
use std::process::ExitCode;

use topwords::Config;

fn main() -> ExitCode {
    let config = match Config::build(env::args()) {
        Ok(config) => config,
        Err(message) => {
            eprintln!("error: {message}");
            eprintln!("usage: topwords <file> [count]");
            return ExitCode::from(2);
        }
    };

    if let Err(error) = topwords::run(&config) {
        eprintln!("error: {error}");
        return ExitCode::FAILURE;
    }
    ExitCode::SUCCESS
}
```

```text
$ cargo run --quiet -- notes.txt
  4 the
  3 fox
  2 dog
$ cargo run --quiet -- notes.txt many
error: `many` is not a count
usage: topwords <file> [count]
$ echo $?
2
$ cargo run --quiet -- missing.txt
error: cannot read missing.txt: No such file or directory (os error 2)
$ echo $?
1
```

Every program ends with an **exit code**, a small number that the shell and other programs
read. Zero means success; anything else means failure. `echo $?` shows the last one in
Bash; PowerShell uses `$LASTEXITCODE`. Returning `ExitCode` from `main` sets it:
`ExitCode::SUCCESS`, `ExitCode::FAILURE`, or a number of your choice with `ExitCode::from`.
This tool uses 2 for wrong usage and 1 for a failed run, so a script can tell them apart.

`main` may also return a `Result`. An `Err` then prints the error's `Debug` form and exits with
code 1: handy for small tools, with less control over the wording. Avoid `std::process::exit`
in the middle of a program: it stops without running the cleanup code of values still in
scope.

## Why standard error matters

A program has two output streams. **Standard output** carries results, and `println!` writes
to it. **Standard error** carries diagnostics, and `eprintln!` writes to it. Both appear in the
terminal, but they can be redirected separately.

```text
$ cargo run --quiet -- notes.txt 2 > out.txt
$ cargo run --quiet -- missing.txt > out.txt
error: cannot read missing.txt: No such file or directory (os error 2)
```

`> out.txt` sends standard output to a file. In the first command the result goes into the
file and the terminal stays quiet. In the second, the error still reaches the terminal and
`out.txt` is empty. Printed with `println!`, the error would have vanished into the file, to be
mistaken for a result by whatever reads it next.

## Common mistakes

- **Indexing `args` directly.** A missing argument becomes a panic. Use `next()` or `get()`.
- **Printing errors with `println!`.** They end up in files and pipes.
- **Exiting with 0 after a failure.** Scripts then carry on as if all were well.
- **Logic inside `main`.** It cannot be unit tested. Move it behind a function that takes
  values and returns values.

## Practice

1. What does `cargo run --quiet -- notes.txt 0` print, and what is the exit code?
2. Add a test showing that `Config::build` rejects a count of `"many"`.
3. Change the tool so that a missing file exits with code 3.

### Answers

1. Nothing: `truncate(0)` leaves an empty list. The exit code is 0, since nothing failed.
2. Build the arguments as in the existing test, with `"many"` as a third item, and write
   `assert!(Config::build(args).is_err());`.
3. In `main`, replace `ExitCode::FAILURE` with `ExitCode::from(3)`. To use 3 for missing files
   only, `run` must return an error enum that `main` can `match` on.

## Key takeaways

- `env::args()` gives the arguments, with the program name first. Never index it blindly.
- Keep `main.rs` thin: parse, call the library, report. Logic in `lib.rs` can be tested.
- Results go to standard output, errors to standard error with `eprintln!`.
- Return `ExitCode` from `main`: zero for success, non-zero for failure.

## Further reading

- [The Rust Programming Language: Refactoring to Improve Modularity and Error Handling](https://doc.rust-lang.org/book/ch12-03-improving-error-handling-and-modularity.html)
- [The Rust Programming Language: Redirecting Errors to Standard Error](https://doc.rust-lang.org/book/ch12-06-writing-to-stderr-instead-of-stdout.html)
- [Standard library: `std::process::ExitCode`](https://doc.rust-lang.org/std/process/struct.ExitCode.html)
- [Standard library: `std::env::args`](https://doc.rust-lang.org/std/env/fn.args.html)
