---
title: API Design and Semantic Versioning
summary: Design public interfaces that are easy to call and hard to misuse, and know exactly which changes break the people who depend on you.
minutes: 30
objectives:
  - Choose parameter types that accept the widest useful input, including borrowed keys through `Borrow`
  - Encode rules in types with newtypes, `NonZero` integers and builders
  - Classify a change to a public API as major or minor under semantic versioning
  - Keep an API extensible with `#[non_exhaustive]`, private fields and sealed traits
---

## Outline

1. A signature is a promise
2. Types that carry the rules
3. Builders
4. What semantic versioning counts as breaking
5. Leaving room to grow

## A signature is a promise

Everything `pub` in a library is a promise to people you will never meet. The Rust API
Guidelines record what experienced library authors agree on. Five of them matter daily:

- **Accept the most general borrowed input.** Take `&str`, not `&String`, and `&[T]`, not
  `&Vec<T>`. Every caller can produce the general form, and not every caller has the specific
  one.
- **Take ownership when you need it.** A function that stores a string should take `String`
  or `impl Into<String>`, not `&str` plus a hidden copy. The caller decides where copies
  happen.
- **Let lookups borrow.** A map with `String` keys should be searchable with a `&str`.
- **Return what would otherwise be lost.** `HashMap::insert` hands back the value it
  replaced, so nothing is dropped behind the caller's back.
- **Implement the common traits eagerly**: `Debug`, `Clone`, `PartialEq`, `Eq`, `Hash` and
  `Default` where they make sense. The **orphan rule** allows a trait implementation only in
  the crate that defines the trait or the type, so your users cannot add them.

```rust
use std::borrow::Borrow;
use std::collections::HashMap;
use std::hash::Hash;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OrderId(u64);

pub struct Registry<K, V> {
    entries: HashMap<K, V>,
}

impl<K: Hash + Eq, V> Registry<K, V> {
    pub fn new() -> Self {
        Registry { entries: HashMap::new() }
    }

    pub fn insert(&mut self, key: K, value: V) -> Option<V> {
        self.entries.insert(key, value)
    }

    /// Accepts any borrowed form of the key, as `HashMap::get` does.
    pub fn get<Q>(&self, key: &Q) -> Option<&V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        self.entries.get(key)
    }
}

fn owner_of(orders: &Registry<OrderId, UserId>, order: OrderId) -> Option<UserId> {
    orders.get(&order).copied()
}

fn main() {
    let mut names: Registry<String, UserId> = Registry::new();
    names.insert("ada".to_string(), UserId(1));
    println!("{:?}", names.get("ada")); // a &str: no String is built

    let mut orders = Registry::new();
    orders.insert(OrderId(77), UserId(1));
    println!("{:?}", owner_of(&orders, OrderId(77)));
    // owner_of(&orders, UserId(77)) does not compile: expected `OrderId`
}
```

```text
Some(UserId(1))
Some(UserId(1))
```

`K: Borrow<Q>` reads "a `K` can be viewed as a `&Q`". `String` implements `Borrow<str>`, so
the lookup takes a `&str` and allocates nothing. `Borrow` also promises that the borrowed
form hashes and compares exactly like the owned one, which is what makes the lookup correct.
`?Sized` admits types without a fixed size, such as `str`.

## Types that carry the rules

`UserId` and `OrderId` are **newtypes**: structs with one field that exist only to be
distinct types. Both wrap a `u64`, yet passing one where the other is expected is a compile
error, and the wrapper costs nothing at run time. The same idea removes whole checks:

- A capacity of type `NonZeroUsize` cannot be zero, so the function needs no check, no error
  and no sentence in the documentation about zero.
- An enum such as `Compression::On` says more at the call site than `true`, and can gain a
  third state later.

The guidelines prefer this static enforcement. A run-time check comes second: it costs time,
finds the bug later and hands the caller a failure to deal with.

## Builders

A constructor with eight positional arguments is unreadable, and adding a ninth breaks every
caller. A **builder** gathers settings by name and supplies defaults.

```rust
use std::num::NonZeroUsize;

#[derive(Debug, Clone, PartialEq)]
pub struct Client {
    host: String,
    retries: u32,
    pool: NonZeroUsize,
}

#[derive(Debug, Clone)]
pub struct ClientBuilder {
    host: String,
    retries: u32,
    pool: NonZeroUsize,
}

impl Client {
    /// Starts a builder with the one required setting and sensible defaults.
    pub fn builder(host: impl Into<String>) -> ClientBuilder {
        ClientBuilder { host: host.into(), retries: 3, pool: NonZeroUsize::MIN }
    }
}

impl ClientBuilder {
    pub fn retries(mut self, retries: u32) -> Self {
        self.retries = retries;
        self
    }

    pub fn pool(mut self, pool: NonZeroUsize) -> Self {
        self.pool = pool;
        self
    }

    pub fn build(self) -> Client {
        Client { host: self.host, retries: self.retries, pool: self.pool }
    }
}

fn main() {
    let client = Client::builder("db.internal").retries(5).build();
    println!("{client:?}");
}
```

```text
Client { host: "db.internal", retries: 5, pool: 1 }
```

These methods take and return `self`, which allows one-line chains. The other style takes
`&mut self` and returns `&mut Self`, as `std::process::Command` does. It suits configuration
spread over several statements. Either way, a new setting is a new method.

## What semantic versioning counts as breaking

Under **semantic versioning** a version is `MAJOR.MINOR.PATCH`, and an upgrade that keeps
`MAJOR` must not break code that compiled before. Cargo relies on it: the requirement
`"1.4"` accepts any `1.x.y` from 1.4.0 up, so a breaking change shipped as 1.5.0 breaks users
who changed nothing. Before 1.0 the leftmost non-zero number plays the major role: 0.3 to 0.4
is breaking.

Changes that need a new major version:

- removing or renaming a public item, or changing a function's parameters;
- adding a public field to a struct whose fields are all public, because struct literals stop
  compiling;
- adding a variant to an enum that is not `#[non_exhaustive]`, because exhaustive matches
  break;
- adding a trait method with no default body, because every implementor breaks;
- adding a generic method that stops a trait being used as `dyn Trait`;
- tightening a generic bound.

Adding functions, types and modules is minor. So is adding a private field to a struct that
already has one. Adding a trait method **with** a default body and raising the minimum Rust
version are "possibly breaking": allowed in a minor release, but worth a line in the release
notes. The tool `cargo-semver-checks` compares your API with the last published version. It
catches many of these, not all.

## Leaving room to grow

```rust
pub mod codec {
    mod private {
        pub trait Sealed {}
    }

    /// Callers may use this trait but cannot implement it, so methods can be
    /// added in a minor release.
    pub trait Codec: private::Sealed {
        fn name(&self) -> &'static str;
    }

    pub struct Gzip;
    impl private::Sealed for Gzip {}
    impl Codec for Gzip {
        fn name(&self) -> &'static str {
            "gzip"
        }
    }

    #[derive(Debug)]
    #[non_exhaustive]
    pub enum CodecError {
        Truncated,
        BadChecksum,
    }
}

use codec::{Codec, CodecError};

fn describe(error: &CodecError) -> &'static str {
    match error {
        CodecError::Truncated => "input ended early",
        CodecError::BadChecksum => "checksum mismatch",
        // A caller in another crate must add `_ => ...` here.
    }
}

fn main() {
    println!("{}", codec::Gzip.name());
    println!("{}", describe(&CodecError::Truncated));
}
```

```text
gzip
input ended early
```

- **`#[non_exhaustive]`** makes other crates write a wildcard arm when they match the enum,
  and forbids struct literals for a marked struct. Variants and fields can then be added in a
  minor release. It has no effect inside the defining crate, which is why `describe`
  compiles. The price: callers lose the compiler's check that they handled every case.
- **Private fields** with a constructor or builder give structs the same freedom.
- **A sealed trait** has a supertrait in a private module. Other crates can name and call
  `Codec` but cannot name `Sealed`, so they cannot implement it, and new methods break
  nobody. The price: users cannot plug in their own implementation.
- **Export less.** Every public item must be supported until the next major version.

## Common mistakes

- **Public fields "for convenience"** on a struct that will need a new field one day.
- **Adding `#[non_exhaustive]` later.** Adding it to a published enum is itself a breaking
  change. Decide before 1.0.
- **Exposing a dependency's types.** Their major versions then become yours.
- **`&String` and `&Vec<T>` parameters.** They reject callers for no benefit.
- **A required method added to a trait that users implement.** Give it a default body or
  seal the trait.

## Practice

1. Improve `pub fn find(names: &Vec<String>, wanted: &String) -> bool`.
2. Classify each change to a 1.x library as major or minor: (a) a new inherent method
   `len(&self)` on a public struct; (b) a new variant on `pub enum Mode { Fast, Safe }`;
   (c) a private field added to `pub struct Config { pub retries: u32 }`.
3. Add an optional `verbose` setting to `ClientBuilder`. Is that a breaking change?

### Answers

1. `pub fn find(names: &[String], wanted: &str) -> bool`. Existing calls still compile,
   because `&Vec<String>` and `&String` coerce to the new types, and callers holding a slice
   or a literal now work too.
2. (a) Minor: it is a new item. (b) Major: `Mode` is not `#[non_exhaustive]`, so a downstream
   `match` with two arms stops compiling. (c) Major: every field was public, so users could
   write `Config { retries: 3 }`, and that literal now fails.
3. Add `verbose: bool` to both structs with the default `false` in `Client::builder`, copy it
   in `build`, and add `pub fn verbose(mut self, on: bool) -> Self`. It is a minor change:
   the fields are private and every `Client` is created through the builder, so no existing
   call needs to change.

## Key takeaways

- Take general, borrowed inputs, and let lookups borrow with `Borrow`.
- Put rules in types: newtypes, `NonZero` integers, enums in place of flags.
- A builder makes construction readable and extensible.
- If a change can stop downstream code compiling, it needs a major version.
- `#[non_exhaustive]`, private fields and sealed traits buy room to grow, each at a price.

## Further reading

- [Rust API Guidelines: Checklist](https://rust-lang.github.io/api-guidelines/checklist.html)
- [The Cargo Book: SemVer compatibility](https://doc.rust-lang.org/cargo/reference/semver.html)
- [The Rust Reference: The `non_exhaustive` attribute](https://doc.rust-lang.org/reference/attributes/type_system.html)
- [Rust API Guidelines: Future proofing](https://rust-lang.github.io/api-guidelines/future-proofing.html)
