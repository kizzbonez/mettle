---
title: Packages, Crates and Modules
summary: Organize a growing program into modules with deliberate privacy, refer to items by path, and split the code across files.
minutes: 25
objectives:
  - Tell a package, a crate and a module apart, and name the files Cargo treats as crate roots
  - Decide what code outside a module may use with `pub`, `pub(crate)` and private fields
  - Refer to items by absolute and relative paths and shorten them with `use`
  - Move a module into its own file and predict where the compiler looks for it
---

## Outline

1. Packages and crates
2. Modules and privacy
3. Paths and `use`
4. Modules in their own files

## Packages and crates

So far each program has lived in one file. Larger programs need structure, and Rust offers three
levels of it.

A **crate** is the unit the compiler builds in one go. A *binary crate* has a `main` function and
becomes an executable. A *library crate* has no `main`: it holds code for other crates to use.
The file the compiler starts from is the **crate root**.

A **package** is a folder with a `Cargo.toml` that says how to build one or more crates. Cargo
finds the crate roots by convention:

- `src/main.rs` is the root of a binary crate named after the package.
- `src/lib.rs` is the root of a library crate named after the package.
- Every file in `src/bin/` is the root of one more binary crate.

A package has at most one library crate, any number of binary crates, and at least one crate in
total. `cargo new` creates `src/main.rs`; `cargo new --lib` creates `src/lib.rs` instead.

## Modules and privacy

A **module** is a named group of items (functions, structs, enums, other modules) inside a crate,
declared with `mod`. Modules give names a home and decide what is visible from outside.
Everything in a module is **private** by default: usable in that module and in the modules nested
inside it, and nowhere else. `pub` makes an item public.

```rust
mod kitchen {
    pub struct Order {
        pub dish: String,
        minutes: u32, // private: only code inside `kitchen` can touch it
    }

    impl Order {
        pub fn new(dish: &str) -> Order {
            Order { dish: dish.to_string(), minutes: estimate(dish) }
        }

        pub fn minutes(&self) -> u32 {
            self.minutes
        }
    }

    fn estimate(dish: &str) -> u32 {
        if dish == "soup" { 5 } else { 12 }
    }

    pub mod pantry {
        pub fn restock(item: &str) -> String {
            super::label(item) // a child may use its parent's private items
        }
    }

    fn label(item: &str) -> String {
        format!("restocked {item}")
    }
}

use kitchen::{Order, pantry};

fn main() {
    let order = Order::new("soup");
    println!("{} in {} minutes", order.dish, order.minutes());
    println!("{}", pantry::restock("rice"));
    println!("{}", crate::kitchen::pantry::restock("salt"));
}
```

```text
soup in 5 minutes
restocked rice
restocked salt
```

Three rules are at work.

- The fields of a `pub struct` are still private one by one. Because `minutes` is private, code
  outside `kitchen` cannot build an `Order` itself and must call `Order::new`. That is how a type
  keeps its data valid.
- The variants of a `pub enum` are all public.
- Privacy only blocks looking inward. `pantry` may call `label` in its parent, but `kitchen`
  could not call a private function of `pantry`.

`pub(crate)` is the middle setting: visible everywhere in this crate, hidden from crates that
use it as a library.

Add `let minutes = kitchen::estimate("soup");` to `main` and the build fails:

```text
error[E0603]: function `estimate` is private
  --> src/main.rs:39:28
   |
39 |     let minutes = kitchen::estimate("soup");
   |                            ^^^^^^^^ private function
```

The first line gives an error code and the item; the arrow gives file, line and column; the
carets mark the exact name. Add `pub` only if outside code truly needs the item.

## Paths and `use`

A **path** names an item by walking the module tree with `::`.

- An *absolute path* starts at the crate root: `crate::kitchen::pantry::restock`.
- A *relative path* starts in the current module: `kitchen::pantry::restock`. `super::` starts
  in the parent module and `self::` in the current one.

`use` brings a path into scope so that a short name works. Braces import several names at once:
`use kitchen::{Order, pantry};`, or `use std::io::{self, Write};` for `io` itself plus
`io::Write`. `as` renames on the way in: `use std::fmt::Result as FmtResult;`.

By convention you import the parent module of a function and call `pantry::restock(...)`, which
shows where the function comes from, but you import structs and enums by their full path, as in
`use std::collections::HashMap;`. `pub use` re-exports an item, making it reachable under a
shorter public path than the one where it is defined.

## Modules in their own files

Write `mod kitchen;` with a semicolon instead of a body, and the compiler loads the module from
a file. For a module declared in the crate root it looks for `src/kitchen.rs` (or, in the older
style, `src/kitchen/mod.rs`). A module declared inside `kitchen` lives one folder down.

```text
restaurant/
├── Cargo.toml
└── src/
    ├── main.rs          mod kitchen;
    ├── kitchen.rs       pub mod pantry;   pub fn cook(...)
    └── kitchen/
        └── pantry.rs    pub fn restock(...)
```

```rust
// src/main.rs
mod kitchen;

use kitchen::pantry;

fn main() {
    println!("{}", kitchen::cook("soup"));
    println!("{}", pantry::restock("rice"));
}
```

```text
cooking soup
restocked rice
```

`mod` is not an "include". Declare each module once, in its parent; every other file reaches it
by path. Folders mirror the module tree, so the layout tells you the path.

A package with both `src/lib.rs` and `src/main.rs` has two crates. Put the modules in the
library and let the binary use it like any outside crate, by package name:
`use restaurant::kitchen;`. The binary then sees only the library's `pub` items, and `main.rs`
stays small. The lessons on testing and command-line tools build on this layout.

## Common mistakes

- **Making the module public but not the item.** `pub mod pantry` lets others name the module.
  `restock` still needs its own `pub`.
- **Declaring a module twice.** `mod kitchen;` in two files asks for two modules. Declare it
  once, then write `use crate::kitchen;` elsewhere.
- **A misplaced file.** `mod pantry;` inside `src/kitchen.rs` needs `src/kitchen/pantry.rs`,
  not `src/pantry.rs`. Error E0583 lists the paths the compiler tried.
- **Expecting `use` to reach into nested modules.** A `use` applies only to the module it is
  written in:

```rust
mod shapes {
    pub mod circle {
        pub fn area(radius: f64) -> f64 {
            std::f64::consts::PI * radius * radius
        }
    }
}

mod report {
    pub fn print() {
        println!("{:.2}", circle::area(1.0));
    }
}

use shapes::circle;

fn main() {
    report::print();
}
```

```text
error[E0433]: cannot find module or crate `circle` in this scope
  --> src/main.rs:11:27
   |
11 |         println!("{:.2}", circle::area(1.0));
   |                           ^^^^^^ use of unresolved module or unlinked crate `circle`
```

Move the `use` into `report`, or write `super::circle::area(1.0)`.

## Practice

1. In the `kitchen` example, `main` gains the line `println!("{}", order.minutes);` with no
   parentheses. Does it compile?
2. A package contains `src/main.rs`, `src/lib.rs` and `src/bin/report.rs`. How many crates is
   that, and of which kinds?
3. `src/lib.rs` says `mod billing;` and `src/billing.rs` says `pub mod tax;`. Where is the code
   of `tax`, and what is the absolute path of its function `rate`?

### Answers

1. No. The field is private, so the compiler reports
   ``error[E0616]: field `minutes` of struct `Order` is private``. `order.minutes()` works
   because that method is `pub` and is defined inside `kitchen`.
2. Three: one library crate (`src/lib.rs`) and two binary crates.
3. In `src/billing/tax.rs` (or `src/billing/tax/mod.rs`). The path is
   `crate::billing::tax::rate`.

## Key takeaways

- A package (one `Cargo.toml`) builds crates; a crate is a tree of modules that starts at its
  root file.
- Items are private until you write `pub`. Struct fields are private individually, and nested
  modules can see the private items of their ancestors.
- Paths start at `crate`, at the current module or at `super`; `use` shortens them in one scope.
- `mod name;` loads `name.rs` from the folder that matches the module tree.

## Further reading

- [The Rust Programming Language: Defining Modules to Control Scope and Privacy](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html)
- [The Rust Programming Language: Separating Modules into Different Files](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html)
- [The Rust Reference: Visibility and Privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html)
- [Rust by Example: Visibility](https://doc.rust-lang.org/rust-by-example/mod/visibility.html)
