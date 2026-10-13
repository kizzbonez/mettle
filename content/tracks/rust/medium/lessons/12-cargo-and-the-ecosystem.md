---
title: Cargo and the Ecosystem
summary: Read and write a `Cargo.toml`, depend on other people's crates safely, control how your code is built, and use the tools every Rust project relies on.
minutes: 25
objectives:
  - Explain what `Cargo.toml` and `Cargo.lock` are each for
  - Work out which versions a requirement such as `"1.4"` or `"0.3.2"` allows
  - Define a feature and choose between the `dev` and `release` profiles
  - Run `cargo fmt`, `cargo clippy` and `cargo doc`, and describe a workspace
---

## Outline

1. `Cargo.toml` and `Cargo.lock`
2. Dependencies and semantic versioning
3. Features
4. Build profiles
5. `rustfmt`, Clippy and `cargo doc`
6. A first look at workspaces

## `Cargo.toml` and `Cargo.lock`

Cargo builds your code, fetches the code you depend on, and runs your tests. Every package has
a **manifest**, the file `Cargo.toml`, which you write. It is divided into tables, each
introduced by a name in square brackets.

```toml
[package]
name = "meter"
version = "0.1.0"
edition = "2024"

[dependencies]

[features]
default = []
loud = []

[profile.release]
overflow-checks = true
```

```text
$ cargo build
   Compiling meter v0.1.0 (/work/meter)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.36s
```

`[package]` describes the package. `edition` selects the edition of the language. A package
without that key is treated as edition 2015, so keep the line that `cargo new` writes. The
other tables are explained below.

The first build also creates `Cargo.lock`. Cargo writes this file, not you. It records the
exact version of every dependency that was used, so that the next build, on any machine, uses
the same ones. The Cargo Book's advice is: when in doubt, commit `Cargo.lock` to version
control.

## Dependencies and semantic versioning

A **dependency** is another package your code uses. By default it comes from crates.io, the
community's package registry. Add a line to `[dependencies]`, or let `cargo add regex` do it.

```toml
[dependencies]
regex = "1.10"                                         # from crates.io
serde = { version = "1.0.118", features = ["derive"] } # with one of its features turned on
pricing = { path = "../pricing" }                      # a package on your own disk

[dev-dependencies]
tempfile = "3"                                         # only for tests and examples
```

The string is not one version. It is a **version requirement**, and it rests on **semantic
versioning** (SemVer): a version is `MAJOR.MINOR.PATCH`, and a release that breaks existing
users must raise the major number. Cargo therefore accepts any later version that is still
compatible:

```text
"1.2.3"  means  >=1.2.3, <2.0.0
"0.2.3"  means  >=0.2.3, <0.3.0
"0.0.3"  means  >=0.0.3, <0.0.4
"=1.2.3" means  exactly 1.2.3
```

The rule is "the leftmost non-zero number must not change". Before 1.0, a change in the minor
number counts as breaking.

A requirement gives a range, and `Cargo.lock` pins one version inside it. Builds stay
repeatable until you run `cargo update`, which moves the lock file to the newest versions the
requirements allow. To cross a major version you edit `Cargo.toml` yourself.

## Features

A **feature** is a named switch for optional code. A package lists its features in
`[features]`. The code tests a switch with the attribute `#[cfg(feature = "name")]`, which
includes the next item or statement only when the feature is on.

```rust
fn main() {
    let text = std::env::args().nth(1).unwrap_or(String::from("1"));
    let small: u8 = text.parse().expect("a number from 0 to 255");
    let next = small + 1;

    #[cfg(feature = "loud")]
    println!("LOUD MODE");

    println!("{small} + 1 = {next}");
}
```

```text
$ cargo run -- 41
41 + 1 = 42
$ cargo run --features loud -- 41
LOUD MODE
41 + 1 = 42
```

Cargo's own status lines are left out here. `std::env::args()` yields the command-line
arguments (`nth(1)` is the first after the program's own name), and everything after `--` is
passed to your program instead of to Cargo. The feature named `default` lists the features
that are on unless the user says otherwise. Dependencies have features too:
`features = ["derive"]` above turns one on, and `default-features = false` turns the defaults
off.

If two packages in a build ask for different features of the same dependency, Cargo builds it
once with all of them. A feature should therefore only *add* things.

## Build profiles

A **profile** is a set of compiler settings. `cargo build` and `cargo run` use the `dev`
profile: no optimization, fast to compile, full debugging information, output in
`target/debug`. Adding `--release` selects the `release` profile: slow to compile, fast to run,
output in `target/release`.

Profiles differ in more than speed. `overflow-checks` is on in `dev` and off in `release`, so
without the `[profile.release]` table the same program behaves differently:

```text
$ cargo run -- 255
thread 'main' (128) panicked at src/main.rs:4:16:
attempt to add with overflow

$ cargo build --release
    Finished `release` profile [optimized] target(s) in 0.17s
$ ./target/release/meter 255
255 + 1 = 0
```

The `[profile.release]` table in the manifest above overrides that one setting, and with it
the release build panics too. Measure speed with `--release` only, because a `dev` build is
not optimized.

## `rustfmt`, Clippy and `cargo doc`

```bash
cargo fmt              # rewrite the source in the standard style
cargo fmt --all -- --check   # change nothing; exit with an error code if a file is not formatted
cargo clippy           # run hundreds of extra checks, called lints
cargo doc --open       # build the documentation as HTML and open it
cargo check            # check that the code compiles without building an executable
```

```text
$ cargo doc
 Documenting meter v0.1.0 (/work/meter)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.32s
   Generated /work/meter/target/doc/meter/index.html
```

- **rustfmt** formats code in one agreed style, which ends arguments about layout and keeps
  diffs small.
- **Clippy** is a collection of lints for common mistakes and unidiomatic code. Its lints
  are grouped: `clippy::correctness` lints are errors by default, the
  `style`, `complexity`, `perf` and `suspicious` groups are warnings, and stricter groups such
  as `clippy::pedantic` are off until you enable them. Silence one lint in one place with
  `#[allow(clippy::lint_name)]` above the item.
- **`cargo doc`** turns your `///` comments into a website, by default with your dependencies.

Both are toolchain components. If a command is missing, install it with
`rustup component add rustfmt` or `rustup component add clippy`.

## A first look at workspaces

A **workspace** is a group of packages that are developed together. They share one
`Cargo.lock` and one `target` folder, so all of them use the same dependency versions and
nothing is compiled twice. The root `Cargo.toml` lists the members.

```toml
[workspace]
resolver = "3"
members = ["pricing", "till"]
```

```text
$ cargo run -p till
   Compiling pricing v0.1.0 (/work/shop/pricing)
   Compiling till v0.1.0 (/work/shop/till)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.35s
     Running `target/debug/till`
total: 600 cents
```

The manifest of `till` names its neighbour as a dependency: `pricing = { path = "../pricing" }`.
Membership alone does not create that link. `-p` selects one package, and `cargo test` at the
root tests them all.

## Common mistakes

- **Editing `Cargo.lock` by hand.** Change `Cargo.toml`, or run `cargo update`.
- **Reading `"1.2"` as "exactly 1.2".** It allows every 1.x from 1.2.0 upwards.
- **Relying on integer overflow wrapping.** It panics in `dev`. Use explicit methods such as
  `wrapping_add` or `checked_add`.

## Practice

1. Which of 0.3.2, 0.3.9, 0.4.0 and 1.0.0 does the requirement `"0.3.2"` accept?
2. You pull a colleague's change and the build uses a different version of a dependency than
   yesterday. Which file changed?
3. Add a feature `metric` that is on by default.

### Answers

1. 0.3.2 and 0.3.9. The leftmost non-zero number is the 3, so 0.4.0 and 1.0.0 count as
   breaking.
2. `Cargo.lock`, which pins the exact versions.
3. In `Cargo.toml`: `[features]`, then `default = ["metric"]` and `metric = []`. In the code,
   mark the optional items with `#[cfg(feature = "metric")]`.

## Key takeaways

- You write `Cargo.toml`; Cargo writes `Cargo.lock`, which pins exact versions for repeatable
  builds.
- A version requirement allows compatible updates: the leftmost non-zero number stays fixed.
- Features switch optional code on and must only add; profiles decide how code is compiled.
- `cargo fmt`, `cargo clippy`, `cargo test` and `cargo doc` are part of everyday work.

## Further reading

- [The Cargo Book: Specifying Dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html)
- [The Cargo Book: Features](https://doc.rust-lang.org/cargo/reference/features.html)
- [The Cargo Book: Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html)
- [Clippy documentation](https://doc.rust-lang.org/clippy/)
