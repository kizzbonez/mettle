---
title: Advanced Traits and Types
summary: Associated types, operator overloading, supertraits, methods that share a name, the newtype pattern and type aliases, with the reason each one exists.
minutes: 30
objectives:
  - Choose between an associated type and a generic parameter when designing a trait
  - Overload an operator by implementing a trait from `std::ops`
  - Require one trait from another with a supertrait, and call a specific trait's method by name
  - Use a newtype to get past the orphan rule or to keep similar values apart, and say how a type alias differs
---

## Outline

1. Associated types
2. Operator overloading
3. Methods with the same name
4. Supertraits
5. The newtype pattern
6. Type aliases

## Associated types

An **associated type** is a placeholder type declared inside a trait. Each implementation fills it in.

```rust
use std::fmt::Debug;

trait Sensor {
    type Reading;

    fn read(&self) -> Self::Reading;
}

struct Thermometer;
struct DoorSwitch;

impl Sensor for Thermometer {
    type Reading = f64;

    fn read(&self) -> f64 {
        21.5
    }
}

impl Sensor for DoorSwitch {
    type Reading = bool;

    fn read(&self) -> bool {
        true
    }
}

fn log<S: Sensor>(sensor: &S) -> String
where
    S::Reading: Debug,
{
    format!("{:?}", sensor.read())
}

fn main() {
    println!("{} {}", log(&Thermometer), log(&DoorSwitch));
}
```

```text
21.5 true
```

Why not a generic trait, `trait Sensor<R>`? Because then one type could implement both `Sensor<f64>` and `Sensor<i32>`, and every call to `read` would have to say which one it means. With an associated type a type implements the trait **once**, so the implementing type decides the reading type and callers never annotate it. A second `impl Sensor for Thermometer` is rejected as a conflicting implementation (`E0119`).

Use an associated type when there is one natural answer per implementor: `Iterator::Item`, `Deref::Target`, `Future::Output`. Use a generic parameter when a type may implement the trait several times, as with `From<T>`. Other code names the type as `S::Reading`, and can fix it with `impl Sensor<Reading = f64>`.

## Operator overloading

Operators are trait methods. `a + b` is a call to `Add::add(a, b)`, and the traits live in `std::ops`. You cannot invent operators, but you can implement the existing ones for your own types.

```rust
use std::ops::{Add, Mul};

#[derive(Debug, Clone, Copy, PartialEq)]
struct Vec2 {
    x: f64,
    y: f64,
}

impl Add for Vec2 {
    type Output = Vec2;

    fn add(self, other: Vec2) -> Vec2 {
        Vec2 { x: self.x + other.x, y: self.y + other.y }
    }
}

impl Mul<f64> for Vec2 {
    type Output = Vec2;

    fn mul(self, factor: f64) -> Vec2 {
        Vec2 { x: self.x * factor, y: self.y * factor }
    }
}

fn main() {
    let a = Vec2 { x: 1.0, y: 2.0 };
    let b = Vec2 { x: 0.5, y: -1.0 };
    println!("{:?}", a + b);
    println!("{:?}", (a + b) * 2.0);
    println!("{}", a + b == b + a);
}
```

```text
Vec2 { x: 1.5, y: 1.0 }
Vec2 { x: 3.0, y: 2.0 }
true
```

The standard library declares the trait as `trait Add<Rhs = Self>`. `Rhs = Self` is a **default type parameter**: writing `impl Add for Vec2` means `Add<Vec2>`, the common case of adding two values of one type. `Mul<f64>` replaces the default, so a vector can be multiplied by a plain number. `Output` is an associated type: the operand types decide the result type. `==` comes from `PartialEq`, which is derived here.

## Methods with the same name

Two traits may define a method with the same name, and one type may implement both. Then the short call is ambiguous and you must name the trait:

```rust
trait Metric {
    fn label(&self) -> String;
}

trait Imperial {
    fn label(&self) -> String;
}

struct Distance(f64);

impl Metric for Distance {
    fn label(&self) -> String {
        format!("{} km", self.0)
    }
}

impl Imperial for Distance {
    fn label(&self) -> String {
        format!("{:.1} mi", self.0 * 0.621)
    }
}

fn main() {
    let d = Distance(10.0);
    println!("{}", Metric::label(&d));
    println!("{}", <Distance as Imperial>::label(&d));
}
```

```text
10 km
6.2 mi
```

`d.label()` fails with `error[E0034]: multiple applicable items in scope`. The second form, `<Type as Trait>::function(..)`, is the **fully qualified syntax**. It is required for trait functions that have no `self` argument, where nothing else tells the compiler which type's implementation you mean. If the type also has its own method called `label`, the plain call picks that one.

## Supertraits

A **supertrait** is a trait that another trait requires. `trait Banner: fmt::Display` reads "a type can implement `Banner` only if it also implements `Display`". In return, the trait's own methods may use everything the supertrait offers.

```rust
use std::fmt;

trait Banner: fmt::Display {
    fn banner(&self) -> String {
        let text = self.to_string();
        let rule = "=".repeat(text.len());
        format!("{rule}\n{text}\n{rule}")
    }
}

struct Release {
    version: u32,
}

impl fmt::Display for Release {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "release v{}", self.version)
    }
}

impl Banner for Release {}

fn main() {
    println!("{}", Release { version: 3 }.banner());
}
```

```text
==========
release v3
==========
```

Delete the `Display` implementation and the compiler points at both ends of the broken promise:

```text
error[E0277]: `Release` doesn't implement `std::fmt::Display`
  --> src/main.rs:15:17
   |
15 | impl Banner for Release {}
   |                 ^^^^^^^ unsatisfied trait bound
   |
note: required by a bound in `Banner`
  --> src/main.rs:3:15
   |
 3 | trait Banner: fmt::Display {
   |               ^^^^^^^^^^^^ required by this bound in `Banner`
```

This is a requirement, not inheritance. No fields and no code are copied from one type to another.

## The newtype pattern

The **orphan rule** says you may implement a trait for a type only if the trait or the type is defined in your own crate. Otherwise two crates could each provide the same implementation and nobody could decide between them. So this is refused:

```text
error[E0117]: only traits defined in the current crate can be implemented for types defined outside of the crate
 --> src/main.rs:3:1
  |
3 | impl fmt::Display for Vec<String> {
  | ^^^^^^^^^^^^^^^^^^^^^^-----------
  |                       |
  |                       `Vec` is not defined in the current crate
```

A **newtype** is a tuple struct with one field. It is a new, local type, so the rule is satisfied, and it costs nothing at run time. The same trick keeps apart values that share a representation.

```rust
use std::fmt;

struct Csv(Vec<String>);

impl fmt::Display for Csv {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0.join(";"))
    }
}

struct UserId(u64);
struct OrderId(u64);

type Row = Vec<String>;

fn cancel(order: OrderId) -> String {
    format!("cancelled order {}", order.0)
}

fn main() {
    let row: Row = vec![String::from("ada"), String::from("42")];
    let plain: Vec<String> = row.clone(); // an alias is the same type
    println!("{} {}", Csv(row), plain.len());
    println!("{}", cancel(OrderId(7)));
    println!("user {}", UserId(7).0);
}
```

```text
ada;42 2
cancelled order 7
user 7
```

`cancel(UserId(7))` does not compile (`E0308`, mismatched types: an `OrderId` was expected and a `UserId` was found). Two `u64` values that mean different things can no longer be swapped by accident. The cost is that a newtype has none of the inner type's methods. Forward the ones you need, or implement `Deref` if the wrapper is meant to be transparent.

## Type aliases

`type Row = Vec<String>;` gives an existing type a second name. It creates **no** new type: `Row` and `Vec<String>` are interchangeable, as the example shows, so an alias offers no protection. Its job is to shorten long types. The lab's `type Job = Box<dyn FnOnce() + Send + 'static>;` is one example. A module-wide `type Result<T> = std::result::Result<T, ConfigError>;` is another, the pattern `std::io::Result` follows.

## Common mistakes

- **A generic parameter where an associated type was meant.** Callers are then asked for type annotations the compiler cannot infer.
- **Expecting `2.0 * v` after implementing `v * 2.0`.** Each order of operands is its own implementation.
- **Surprising operators.** `+` should add. If the meaning needs explaining, use a named method.
- **Treating an alias as a new type.** `type Meters = f64;` still accepts any `f64`.

## Practice

1. Implement `Sub` for `Vec2` so that `a - b` works.
2. Make `2.0 * a` compile for a `Vec2` called `a`.
3. Define newtypes `Celsius(f64)` and `Fahrenheit(f64)` and implement `From<Celsius> for Fahrenheit`. Why is this safer than two aliases of `f64`?

### Answers

1. Same shape as `Add`:

   ```rust
   impl Sub for Vec2 {
       type Output = Vec2;

       fn sub(self, other: Vec2) -> Vec2 {
           Vec2 { x: self.x - other.x, y: self.y - other.y }
       }
   }
   ```

2. Implement the trait for `f64` with `Vec2` on the right. The orphan rule allows it because `Vec2` is local:

   ```rust
   impl Mul<Vec2> for f64 {
       type Output = Vec2;

       fn mul(self, vector: Vec2) -> Vec2 {
           vector * self
       }
   }
   ```

3. `impl From<Celsius> for Fahrenheit { fn from(c: Celsius) -> Fahrenheit { Fahrenheit(c.0 * 9.0 / 5.0 + 32.0) } }`. With aliases both names are `f64`, so a function expecting Celsius would accept a Fahrenheit value without complaint.

## Key takeaways

- An associated type gives one answer per implementor. A generic parameter allows many.
- Operators are traits in `std::ops`, and `Rhs = Self` is a default type parameter.
- `<Type as Trait>::function` picks one implementation when names clash.
- A supertrait is a requirement that also lets default methods use the required trait.
- A newtype is a new type with no run-time cost. An alias is only a new name.

## Further reading

- [The Rust Programming Language: Advanced Traits](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html)
- [The Rust Programming Language: Advanced Types](https://doc.rust-lang.org/book/ch20-03-advanced-types.html)
- [The Rust Reference: Traits](https://doc.rust-lang.org/reference/items/traits.html)
