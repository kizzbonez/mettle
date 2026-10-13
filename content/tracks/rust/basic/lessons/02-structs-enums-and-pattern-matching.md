---
title: Structs, Enums and Pattern Matching
summary: Model data so that invalid states cannot be written down, then let the compiler check that every case is handled.
minutes: 25
objectives:
  - Define structs with methods and associated functions
  - Model alternatives with enums whose variants carry data
  - Use `match`, `if let` and `let else` to take values apart
  - Explain why exhaustive matching makes changes safer
---

## Outline

1. Structs and methods
2. Enums carry data
3. `match` must cover every case
4. Shorter forms: `if let` and `let else`

## Structs and methods

A struct groups named fields into one type. Behavior goes in an `impl` block. A function that
takes `self` in some form is a method; one that does not, such as `new`, is an associated
function, called with `Parcel::new(...)`.

```rust
#[derive(Debug, Clone, PartialEq)]
struct Parcel {
    id: u32,
    grams: u32,
}

impl Parcel {
    fn new(id: u32, grams: u32) -> Self {
        Parcel { id, grams }
    }

    fn is_heavy(&self) -> bool {
        self.grams > 20_000
    }
}
```

`#[derive(...)]` asks the compiler to write common trait implementations: `Debug` for `{:?}`
printing, `Clone` for `.clone()`, `PartialEq` for `==`.

## Enums carry data

An enum is a type whose value is exactly one of several **variants**. Unlike enums in C, each
variant can hold its own data.

```rust
enum Status {
    Queued,
    InTransit { truck: u16 },
    Delivered(String),      // who signed for it
}
```

A delivered parcel has a signature and a queued one does not. With a struct you would need an
optional `signature` field and a rule nobody enforces. With an enum, the wrong combination
cannot be written down.

## `match` must cover every case

`match` compares a value against patterns, top to bottom, and binds the data inside.

```rust
fn describe(status: &Status) -> String {
    match status {
        Status::Queued => String::from("waiting at the depot"),
        Status::InTransit { truck } if *truck == 0 => String::from("no truck assigned"),
        Status::InTransit { truck } => format!("on truck {truck}"),
        Status::Delivered(name) => format!("signed for by {name}"),
    }
}
```

The compiler rejects a `match` that misses a variant. Add a `Returned` variant next year and
every `match` that needs updating becomes a compile error, not a production bug. A wildcard arm
`_ => ...` turns that check off, so use it with care. The `if` after a pattern is a **guard**:
the arm is taken only when the pattern matches and the condition holds.

## Shorter forms: `if let` and `let else`

When only one pattern matters, a full `match` is noise.

```rust
fn truck_of(status: &Status) -> Option<u16> {
    let Status::InTransit { truck } = status else {
        return None;        // the else branch must leave the function
    };
    Some(*truck)
}

fn announce(status: &Status) {
    if let Status::Delivered(name) = status {
        println!("signed for by {name}");
    }
}
```

`let else` keeps the successful path unindented, which suits validation code: check, bail out,
carry on.

## Key takeaways

- Structs say "all of these"; enums say "exactly one of these".
- Put data inside the variant it belongs to, so invalid states cannot be represented.
- `match` is exhaustive, and that is what makes adding a variant safe.
- Use `if let` and `let else` when a single pattern matters.
