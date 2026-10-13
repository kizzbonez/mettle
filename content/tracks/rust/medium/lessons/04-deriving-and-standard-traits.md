---
title: Deriving and the Standard Traits
summary: Meet the standard library traits that almost every type implements, and let the compiler write most of them for you.
minutes: 25
objectives:
  - Use `#[derive]` and state what it requires of a type's fields
  - Implement `Display` by hand and explain how it differs from `Debug`
  - Choose among `PartialEq`, `Eq`, `PartialOrd`, `Ord` and `Hash` for a type
  - Give a type a default value and conversions with `Default` and `From`
---

## Outline

1. What `#[derive]` does
2. `Debug` and `Display`
3. `Clone` and `Copy`
4. Comparing and hashing
5. `Default`
6. `From` and `Into`

## What `#[derive]` does

The standard library defines a handful of traits that the rest of the language is built on:
printing, copying, comparing, default values, conversions. A new struct or enum has none of
them. Even `==` and `{:?}` do not work until you opt in.

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 1, y: 2 };
    println!("{p:?}");
}
```

```text
error[E0277]: `Point` doesn't implement `Debug`
 --> src/main.rs:8:15
  |
8 |     println!("{p:?}");
  |               ^^^^^ `Point` cannot be formatted using `{:?}` because it doesn't implement `Debug`
  |
  = help: the trait `Debug` is not implemented for `Point`
help: consider annotating `Point` with `#[derive(Debug)]`
```

For many of these traits the implementation is mechanical: do the same thing to every field.
The attribute `#[derive(Trait, ...)]`, placed above a type, asks the compiler to generate that
code. The rule to remember: **a derive works only if every field's type implements the same
trait**, because the generated code calls it field by field.

## `Debug` and `Display`

Both turn a value into text. `Debug` (`{:?}`, or `{:#?}` over several lines) is for programmers
and can be derived. `Display` (`{}`) is for users. It cannot be derived, because only you know
how your type should read.

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let p = Point { x: 1, y: 2 };
    let q = p.clone();

    println!("{p:?}");      // Debug
    println!("{p}");        // Display
    println!("{}", p == q); // PartialEq
    println!("{}", p.to_string().len());
}
```

```text
Point { x: 1, y: 2 }
(1, 2)
true
6
```

`fmt` receives a `Formatter`, the destination of the text, and `write!` works like `println!`
but writes into it. The return type `fmt::Result` reports whether writing succeeded. Implementing
`Display` also gives the type `to_string()`.

## `Clone` and `Copy`

`Clone` provides `.clone()`, an explicit and possibly costly duplicate. `Copy` marks types whose
values are duplicated by simply copying their bits, so assigning them does not move. A type can
be `Copy` only if all its fields are, and it must be `Clone` as well. Derive `Copy` for small
plain values such as a pair of numbers. A struct that owns a `String` cannot be `Copy`; the
compiler answers with E0204.

## Comparing and hashing

- `PartialEq` gives `==` and `!=`. Derived, two structs are equal when all fields are equal, and
  two enum values are equal when they are the same variant with equal fields.
- `Eq` adds the promise that every value equals itself. Floats break it, because `f64::NAN` is
  not equal to itself, so a struct with an `f64` field can derive `PartialEq` but not `Eq`.
- `PartialOrd` gives `<`, `>`, `<=` and `>=`. `Ord` promises a total order, where any two values
  can be compared, and provides `cmp`, `max` and `min`. Sorting needs `Ord`. Derived ordering
  compares fields from top to bottom, and enum variants in the order they are declared.
- `Hash` turns a value into a number for hash tables. A `HashMap` key needs `Hash + Eq`. The
  sorted map `BTreeMap`, met in a later lesson, needs `Ord` keys instead.

```rust
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
enum Level {
    Low,
    High,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct Ticket {
    level: Level,
    id: u32,
}

fn main() {
    let a = Ticket { level: Level::High, id: 1 };
    let b = Ticket { level: Level::Low, id: 9 };

    println!("{}", a > b); // `level` is compared first: High > Low

    let level = a.level; // `Level` is Copy, so `a` is still whole
    println!("{level:?} {a:?}");

    let mut owners = HashMap::new(); // a key needs Hash + Eq
    owners.insert(a.clone(), "ada");
    println!("{}", owners.contains_key(&a));
}
```

```text
true
High Ticket { level: High, id: 1 }
true
```

The field order matters. Had `id` been declared first, `a > b` would be `false`, since 1 is less
than 9.

## `Default`

`Default` provides `Type::default()`, a sensible starting value. Derived, every field takes its
own default: `0`, `false`, an empty `String` or `Vec`, `None`. For an enum, mark one variant
without data with `#[default]`.

## `From` and `Into`

`From<T>` converts a value of type `T` into your type and cannot fail. Implement `From`, and
the matching `Into` comes for free.

```rust
#[derive(Debug, Default)]
struct Settings {
    name: String,
    retries: u32,
    mode: Mode,
}

#[derive(Debug, Default)]
enum Mode {
    #[default]
    Fast,
    Careful,
}

struct Celsius(f64);
struct Fahrenheit(f64);

impl From<Celsius> for Fahrenheit {
    fn from(c: Celsius) -> Fahrenheit {
        Fahrenheit(c.0 * 9.0 / 5.0 + 32.0)
    }
}

fn main() {
    println!("{:?}", Settings::default());

    let custom = Settings { retries: 3, mode: Mode::Careful, ..Default::default() };
    println!("{:?} {} {:?}", custom.name, custom.retries, custom.mode);

    let boiling = Fahrenheit::from(Celsius(100.0));
    let body: Fahrenheit = Celsius(37.0).into(); // `Into` comes for free
    println!("{} {}", boiling.0, body.0);
    println!("{}", u64::from(7_u32));
}
```

```text
Settings { name: "", retries: 0, mode: Fast }
"" 3 Careful
212 98.6
7
```

`..Default::default()` fills the fields you did not name. The standard library uses `From` for
conversions that lose nothing, such as `u64::from(7_u32)` or `String::from("text")`. There is no
`u8::from(300_u32)`, because that conversion can fail. A later lesson covers `TryFrom` for those
cases, and shows how the `?` operator uses `From` to convert errors.

## Common mistakes

- **Deriving a trait a field lacks.** `#[derive(Eq)]` with an `f64` field, or `#[derive(Copy)]`
  with a `String` field, fails. Drop the derive or change the field.
- **Trying to derive `Display`.** It is not derivable. Write `impl fmt::Display`.
- **Deriving `Ord` without thinking about field order.** The first field decides, the rest only
  break ties. Reorder the fields or write `Ord` by hand.
- **Making everything `Copy`.** It is a promise to users of the type: adding a `String` field
  later means removing `Copy`, which breaks their code.
- **Writing `impl Into`.** Implement `From`; `Into` follows.

## Practice

1. Which traits must `struct Sku(u32);` derive to be used as a `HashMap` key and printed with
   `{:?}`?
2. Write `Display` for `struct Money { cents: u64 }` so that 1250 cents prints as `$12.50`.
3. `#[derive(PartialEq, PartialOrd)] struct Version { major: u32, minor: u32 }`: is
   `Version { major: 1, minor: 9 } < Version { major: 2, minor: 0 }`?

### Answers

1. `#[derive(Debug, PartialEq, Eq, Hash)]`. `Eq` needs `PartialEq`, and the map needs
   `Hash + Eq`.
2. The body of `fmt` is `write!(f, "${}.{:02}", self.cents / 100, self.cents % 100)`. `{:02}`
   pads the cents to two digits.
3. Yes. `major` is declared first and 1 is less than 2, so `minor` is never consulted.

## Key takeaways

- `#[derive]` writes the mechanical implementation, provided every field has the trait.
- `Debug` is derived and for programmers; `Display` is written by hand and for users.
- `PartialEq`/`Eq` give equality, `PartialOrd`/`Ord` give ordering by field order, and `Hash`
  with `Eq` makes a hash-map key.
- `Default` supplies starting values; `From` supplies conversions that cannot fail.

## Further reading

- [The Rust Programming Language: Appendix C, Derivable Traits](https://doc.rust-lang.org/book/appendix-03-derivable-traits.html)
- [Standard library: `std::fmt`](https://doc.rust-lang.org/std/fmt/index.html)
- [Standard library: the `From` trait](https://doc.rust-lang.org/std/convert/trait.From.html)
- [Standard library: the `Ord` trait](https://doc.rust-lang.org/std/cmp/trait.Ord.html)
