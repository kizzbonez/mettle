---
title: Enums and Pattern Matching
summary: Model a value that is exactly one of several alternatives, carry data inside each alternative, and take it apart with match, if let and let else.
minutes: 30
objectives:
  - Define enums whose variants carry data and create values of them
  - Handle every variant with `match` and explain why a match must be exhaustive
  - Represent a value that may be missing with `Option<T>`
  - Shorten single-pattern code with `if let` and `let ... else`
---

## Outline

1. An enum is one of several things
2. Taking values apart with `match`
3. More patterns
4. `Option`: a value or nothing
5. Every case must be handled
6. `if let` and `let ... else`

## An enum is one of several things

A struct says "all of these fields together". An *enum* says "exactly one of these
alternatives". The alternatives are called *variants*, and each variant can carry data of
its own.

```rust
#[derive(Debug)]
enum Status {
    Queued,
    InTransit { truck: u16 },
    Delivered(String),
}

impl Status {
    fn describe(&self) -> String {
        match self {
            Status::Queued => String::from("waiting at the depot"),
            Status::InTransit { truck } if *truck == 0 => String::from("no truck assigned"),
            Status::InTransit { truck } => format!("on truck {truck}"),
            Status::Delivered(name) => format!("signed for by {name}"),
        }
    }
}

fn main() {
    let history = [
        Status::Queued,
        Status::InTransit { truck: 14 },
        Status::Delivered(String::from("R. Diaz")),
    ];
    for status in history {
        println!("{status:?}: {}", status.describe());
    }
}
```

```text
Queued: waiting at the depot
InTransit { truck: 14 }: on truck 14
Delivered("R. Diaz"): signed for by R. Diaz
```

`Queued` carries nothing, `InTransit` has a named field like a struct, and `Delivered` holds
a value like a tuple struct. A variant is written with the enum's name and two colons:
`Status::Queued`. Enums take `impl` blocks and derives exactly as structs do.

Why not a struct with a `signed_by` field? Because a queued parcel has no signer, so the field
would need a "not yet" value and a rule that nobody enforces. With the enum, a signer exists
only inside `Delivered`. The wrong combination cannot be written down.

## Taking values apart with `match`

`match` compares a value with a list of *patterns*, from top to bottom, and runs the *arm* of
the first pattern that fits. A pattern can **bind** the data inside a variant to a name:
`Status::Delivered(name)` fits any delivered status and calls its text `name`.

- `match` is an expression. Every arm must produce the same type, here a `String`.
- `self` is a `&Status`, so the names bound by the patterns are references into it. `truck`
  is a `&u16`, which is why the comparison reads `*truck == 0`.
- The `if` after a pattern is a *guard*: the arm is chosen only when the pattern fits and
  the condition is true.

## More patterns

Patterns are not limited to enums.

```rust
fn size_label(kilos: u32) -> &'static str {
    match kilos {
        0 => "empty",
        1..=5 => "small",
        6 | 7 => "medium",
        _ => "large",
    }
}

fn main() {
    println!("{} {} {} {}", size_label(0), size_label(3), size_label(7), size_label(40));

    let fee = match "express" {
        "standard" => 500,
        "express" => 900,
        other => {
            println!("unknown service: {other}");
            0
        }
    };
    println!("fee: {fee}");
}
```

```text
empty small medium large
fee: 900
```

A pattern can be a literal, a range such as `1..=5`, or several alternatives joined by `|`.
The underscore `_` fits anything and ignores it. A plain name such as `other` also fits
anything, and binds the value so the arm can use it.

## `Option`: a value or nothing

Rust has no `null`. A value that may be missing has the type `Option<T>`, an enum from the
standard library with the variants `Some(value)` and `None`. The `T` stands for the type
inside, so an optional number is an `Option<u32>`. Both variants can be written without the
`Option::` prefix.

```rust
fn first_heavy(weights: &[u32]) -> Option<u32> {
    for weight in weights {
        if *weight > 20 {
            return Some(*weight);
        }
    }
    None
}

fn main() {
    let found = first_heavy(&[4, 31, 25]);
    let missing = first_heavy(&[4, 5]);
    println!("{found:?} {missing:?}");

    match found {
        Some(kilos) => println!("first heavy parcel: {kilos} kg"),
        None => println!("nothing heavy"),
    }
}
```

```text
Some(31) None
first heavy parcel: 31 kg
```

An `Option<u32>` is not a `u32`. `found + 1` does not compile, because there might be no
number to add to. You have to take the option apart first, and that forces you to decide what
happens for `None`. The bug of other languages, using a null value by accident, cannot occur.

## Every case must be handled

```rust
fn main() {
    let found: Option<u32> = Some(31);
    match found {
        Some(kilos) => println!("{kilos} kg"),
    }
}
```

```text
error[E0004]: non-exhaustive patterns: `None` not covered
 --> src/main.rs:3:11
  |
3 |     match found {
  |           ^^^^^ pattern `None` not covered
  |
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
  |
4 ~         Some(kilos) => println!("{kilos} kg"),
5 ~         None => todo!(),
  |
```

A note about where `Option` is defined is left out above. A `match` must be *exhaustive*: its
patterns have to cover every possible value. This is the feature that makes enums safe to
change. Add a `Returned` variant to `Status` next year, and the compiler lists every `match`
that has to learn about it. A `_` arm switches that help off, so use one only when "anything
else" really is the right answer.

## `if let` and `let ... else`

When only one pattern matters, a full `match` is more than you need.

```rust
enum Status {
    Queued,
    InTransit { truck: u16 },
    Delivered(String),
}

fn announce(status: &Status) {
    if let Status::Delivered(name) = status {
        println!("signed for by {name}");
    } else {
        println!("not delivered yet");
    }
}

fn truck_of(status: &Status) -> Option<u16> {
    let Status::InTransit { truck } = status else {
        return None;
    };
    Some(*truck)
}

fn main() {
    let moving = Status::InTransit { truck: 14 };
    let done = Status::Delivered(String::from("R. Diaz"));
    announce(&moving);
    announce(&done);
    println!("{:?} {:?} {:?}", truck_of(&moving), truck_of(&done), truck_of(&Status::Queued));
}
```

```text
not delivered yet
signed for by R. Diaz
Some(14) None None
```

- `if let PATTERN = value { ... }` runs its block when the pattern fits. The `else` part is
  optional. You give up the exhaustiveness check in exchange for brevity.
- `let PATTERN = value else { ... };` binds the names for the **rest of the enclosing block**
  when the pattern fits. When it does not, the `else` block runs, and that block must leave:
  with `return`, `break`, `continue` or a panic. It suits checks at the top of a function,
  because the normal path stays unindented.

## Common mistakes

- **Leaving out a variant.** Error `E0004` names the pattern that is not covered.
- **Leaving out the enum's name in a pattern.** In `match heading { North => ... }`, `North`
  is not the variant. It is a new name that fits everything. The compiler rejects this with
  `E0170` and suggests `Direction::North`.
- **Putting the catch-all arm first.** Arms are tried in order, so nothing after `_` can ever
  run. The compiler warns about an "unreachable pattern".
- **Using an `Option<T>` as if it were a `T`.** Take it apart with `match` or `if let`.
- **Comparing enum values with `==` without asking for it.** That needs
  `#[derive(PartialEq)]` on the enum. A `match` needs nothing.

## Practice

1. Define `Shape` with the variants `Circle(f64)` (a radius) and
   `Rectangle { width: f64, height: f64 }`, and a method `area`. Use 3.14159 for pi.
2. Write `describe(number: Option<i32>) -> String` that returns `nothing`, `zero`,
   `negative` or `positive N`.
3. Rewrite the `match` with `if let`:

```rust
let maybe_name = Some("Ada");
match maybe_name {
    Some(name) => println!("hello {name}"),
    None => (),
}
```

### Answers

**1.** and **2.** in one program:

```rust
enum Shape {
    Circle(f64),
    Rectangle { width: f64, height: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(radius) => 3.14159 * radius * radius,
            Shape::Rectangle { width, height } => width * height,
        }
    }
}

fn describe(number: Option<i32>) -> String {
    match number {
        None => String::from("nothing"),
        Some(0) => String::from("zero"),
        Some(n) if n < 0 => String::from("negative"),
        Some(n) => format!("positive {n}"),
    }
}

fn main() {
    let tile = Shape::Rectangle { width: 2.0, height: 3.5 };
    println!("{:.2} {:.2}", Shape::Circle(1.0).area(), tile.area());
    println!("{} {} {}", describe(None), describe(Some(-4)), describe(Some(9)));
}
```

```text
3.14 7.00
nothing negative positive 9
```

**3.** The `None => ()` arm did nothing, so `if let` without an `else` says the same:

```rust
let maybe_name = Some("Ada");
if let Some(name) = maybe_name {
    println!("hello {name}");
}
```

## Key takeaways

- An enum value is exactly one of its variants, and each variant can carry its own data.
- `match` picks the first arm whose pattern fits, binds the data inside, and must cover every
  case.
- `Option<T>` is `Some(value)` or `None`. It replaces null, and it must be taken apart before
  the value can be used.
- `if let` handles one pattern briefly. `let ... else` binds on success and leaves on failure.

## Further reading

- [The Rust Programming Language: Defining an Enum](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html)
- [The Rust Programming Language: The match Control Flow Construct](https://doc.rust-lang.org/book/ch06-02-match.html)
- [The Rust Programming Language: Concise Control Flow with if let and let...else](https://doc.rust-lang.org/book/ch06-03-if-let.html)
- [Standard library: Option](https://doc.rust-lang.org/std/option/enum.Option.html)
