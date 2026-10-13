---
title: Installing Rust and Your First Cargo Project
summary: Install the toolchain with rustup, compile a program by hand with rustc, then let Cargo create, build and run a project for you.
minutes: 25
objectives:
  - Install and update Rust with rustup and confirm which version is installed
  - Compile and run a single source file with rustc
  - Create a project with `cargo new` and use `cargo run`, `cargo build` and `cargo check`
  - Explain what Cargo.toml contains and what a Rust edition is
---

## Outline

1. Three tools: rustup, rustc and cargo
2. Installing
3. A first program, compiled by hand
4. Cargo creates a project
5. Run, build and check
6. Reading your first error
7. Editions

## Three tools: rustup, rustc and cargo

- `rustup` installs Rust and keeps it up to date.
- `rustc` is the compiler. It turns a source file into an executable.
- `cargo` is the build tool and package manager. It creates projects, calls `rustc` for you,
  runs the result and downloads libraries.

One installer provides all three.

## Installing

On Linux and macOS, run this in a terminal and accept the default choice:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

On Windows, download `rustup-init.exe` from `https://www.rust-lang.org/tools/install` and run
it. Rust also needs a *linker*, the program that joins compiled pieces into one executable. On
Windows the installer offers to install the Visual Studio build tools, which include one. On
macOS run `xcode-select --install`. On Linux install GCC or Clang (on Ubuntu, the
`build-essential` package).

The installer adds the tools to your `PATH`, the list of folders in which a terminal looks
for programs. Open a **new** terminal, so that it picks up the change, and check the
installation:

```bash
rustc --version
cargo --version
```

```text
rustc 1.99.0 (b940084d7 2026-09-28)
cargo 1.99.0 (5f94df478 2026-08-27)
```

Your numbers may be higher. Run `rustup update` now and then to get the newest version, and
`rustup doc` to open the documentation that was installed on your machine.

## A first program, compiled by hand

Make a folder, and in it a file named `main.rs`. Rust source files always end in `.rs`.

```rust
fn main() {
    println!("Hello, world!");
}
```

Compile it, then run the executable (`.\main.exe` on Windows):

```bash
rustc --edition 2024 main.rs
./main
```

```text
Hello, world!
```

Line by line:

- `fn main() { ... }` defines a *function*, a named block of code. The one called `main` is
  where every Rust program starts.
- `println!` prints a line of text. The `!` means it is a *macro*, a piece of code that writes
  other code, and not an ordinary function. Macros are always called with the `!`.
- `"Hello, world!"` is a *string literal*: text written directly in the source.
- The `;` ends the instruction, which Rust calls a *statement*. The body is indented by four
  spaces, by convention.

`rustc` compiled *ahead of time*: the `main` file it produced is a real executable, and you
could give it to someone who has never installed Rust.

`print!` works like `println!` but does not end the line:

```rust
fn main() {
    println!("Hello, world!");
    println!("I was compiled by rustc.");
    print!("These two pieces ");
    println!("share one line.");
}
```

```text
Hello, world!
I was compiled by rustc.
These two pieces share one line.
```

## Cargo creates a project

Calling `rustc` by hand stops being practical as soon as a program has several files or uses
a library. From here on, use Cargo.

```bash
cargo new hello_cargo
cd hello_cargo
```

```text
    Creating binary (application) `hello_cargo` package
note: see more `Cargo.toml` keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html
```

Cargo made a folder with this content, and prepared it for Git, the version control tool:

```text
hello_cargo/
├── Cargo.toml
├── .gitignore
└── src/
    └── main.rs
```

`src/main.rs` already holds the hello-world program. `Cargo.toml` is the project's *manifest*,
the file that describes it:

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]
```

`[package]` names the project and its version. `[dependencies]` lists the *crates* it uses. A
crate is a package of Rust code, usually a library. The list is empty, and it stays empty in
this course: everything here uses only the standard library that ships with Rust.

## Run, build and check

```bash
cargo run
```

```text
   Compiling hello_cargo v0.1.0 (/home/ada/hello_cargo)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running `target/debug/hello_cargo`
Hello, world!
```

`cargo run` compiles the project if anything changed and then runs it. The path and the time
will differ on your machine. Run it again without editing and the `Compiling` line is gone,
because Cargo saw that nothing needed rebuilding.

| Command | What it does |
| --- | --- |
| `cargo run` | Builds if needed, then runs the program |
| `cargo build` | Builds only. The executable is `target/debug/hello_cargo` |
| `cargo check` | Checks that the code compiles, without producing an executable |
| `cargo build --release` | Builds with optimizations into `target/release` |

`cargo check` is the one to run constantly while writing: it skips producing the executable,
so it answers "does this compile?" sooner than a build does. *Optimizations* are extra work
the compiler does to make the program faster. A release build therefore takes longer to
compile and runs faster, so it is for the version you hand to users.

The first build also writes `Cargo.lock`, which records the exact version of every
dependency. Cargo maintains it. The `target` folder holds everything that was built and can
always be deleted.

## Reading your first error

Leave out a semicolon between two statements in `src/main.rs`:

```rust
fn main() {
    println!("Hello, world!")
    println!("Goodbye!");
}
```

```text
error: expected `;`, found `println`
 --> src/main.rs:2:30
  |
2 |     println!("Hello, world!")
  |                              ^ help: add `;` here
3 |     println!("Goodbye!");
  |     ------- unexpected token
```

Read it as in the last lesson: the summary says what the compiler expected, `-->` points at
line 2, column 30, and the `help` under the `^` states the fix. No executable is produced until
the error is gone.

## Editions

A new Rust version appears every six weeks, and old code keeps compiling. Now and then the
language needs a change that would break existing code, such as a new *keyword*, a word like
`fn` that the language reserves for itself. Those changes
are collected into an **edition**, and each project chooses its edition with the `edition`
line in `Cargo.toml`. There are four: 2015, 2018, 2021 and 2024. Crates written for different
editions work together, so nobody is forced to upgrade.

`cargo new` picks the newest edition, and this course uses 2024. Plain `rustc` defaults to
2015 for the sake of old code, which is why the command above passed `--edition 2024`.

## Common mistakes

- **Writing `println` without the `!`.** The compiler looks for a function with that name,
  finds none, and reports error `E0423` with the advice to add the `!`.
- **Running Cargo in the wrong folder.** Outside a project, `cargo run` fails because it
  cannot find a `Cargo.toml` there or in any parent folder. Change into the project first.
- **Expecting `cargo check` to make something you can run.** It only reports errors. Use
  `cargo run` or `cargo build` for an executable.
- **Editing files inside `target`.** That folder is generated and is overwritten by the next
  build. Your code lives in `src`.
- **Using the old terminal after installing.** If `rustc` is "not found", open a new
  terminal so that the updated `PATH` is loaded.

## Practice

1. Create a project named `greeter` with Cargo. Change its program so that it prints your name
   on one line and your city on the next, then run it.
2. In that project, delete the `!` from the first `println!` and run `cargo check`. What is
   the error code, and what does the compiler suggest?
3. Run `cargo build`, then `cargo build --release`. Where are the two executables, and how do
   you run one of them without Cargo?

### Answers

**1.** Run `cargo new greeter`, then `cd greeter`, and edit `src/main.rs`. `cargo run` then
builds the project and prints the two lines.

```rust
fn main() {
    println!("Ada Lovelace");
    println!("London");
}
```

```text
Ada Lovelace
London
```

**2.** The code is `E0423`. The summary says that the compiler cannot find a function named
`println`, a note adds that a macro with that name exists, and the `help` line says to use
`!` to invoke the macro and shows the corrected line.

**3.** They are `target/debug/greeter` and `target/release/greeter`, with `.exe` on the end
on Windows. Run one by typing its path, for example `./target/release/greeter`.

## Key takeaways

- `rustup` installs and updates the toolchain, `rustc` compiles, `cargo` runs the whole
  project workflow.
- `cargo new` creates `Cargo.toml` and `src/main.rs`. `cargo run` builds and runs.
- `cargo check` is the fast way to find errors, and `--release` is for the build you ship.
- An edition is an opt-in set of language changes, chosen per project. This course uses 2024.

## Further reading

- [The Rust Programming Language: Installation](https://doc.rust-lang.org/book/ch01-01-installation.html)
- [The Rust Programming Language: Hello, Cargo!](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)
- [The Rust Programming Language: Appendix E, Editions](https://doc.rust-lang.org/book/appendix-05-editions.html)
- [The Cargo Book: Creating a New Package](https://doc.rust-lang.org/cargo/guide/creating-a-new-project.html)
