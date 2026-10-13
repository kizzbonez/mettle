---
title: Generic Types and Functions
summary: Write a function, struct or method once and use it with many types, and understand what the compiler does with it.
minutes: 20
objectives:
  - Write a generic function and add the bound its body needs
  - Define generic structs and enums with one or more type parameters
  - Write `impl` blocks for every type parameter and for one concrete type
  - Explain monomorphization and what it costs
---

## Outline

1. One function, many types
2. Generic structs and enums
3. Methods on generic types
4. Telling the compiler which type you mean
5. What the compiler does: monomorphization

## One function, many types

A function that finds the largest `i32` in a slice and one that finds the largest `f64` have
identical bodies. Only the types differ. A **generic** function replaces the concrete type with a
**type parameter**, a placeholder that each caller fills in. Type parameters are declared in
angle brackets after the function name, and by convention have short names such as `T`.

```rust
fn largest<T>(items: &[T]) -> &T {
    let mut largest = &items[0];
    for item in items {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    println!("{}", largest(&[3, 9, 4]));
}
```

```text
error[E0369]: binary operation `>` cannot be applied to type `&T`
 --> src/main.rs:4:17
  |
4 |         if item > largest {
  |            ---- ^ ------- &T
  |            |
  |            &T
  |
help: consider restricting type parameter `T` with trait `PartialOrd`
  |
1 | fn largest<T: std::cmp::PartialOrd>(items: &[T]) -> &T {
  |             ++++++++++++++++++++++
```

This error is the heart of generics. `T` could be *any* type, and not every type can be compared
with `>`. The body of a generic function may only do what is possible for every allowed `T`. A
**bound**, written `T: PartialOrd`, narrows the allowed types to those that support comparison.
`PartialOrd` is a trait, a named set of abilities; the next lesson is about traits. Here the
`help` section already shows the fix:

```rust
fn largest<T: PartialOrd>(items: &[T]) -> &T {
    let mut largest = &items[0];
    for item in items {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    println!("{}", largest(&[3, 9, 4]));
    println!("{}", largest(&[2.5, 0.1]));
    println!("{}", largest(&["pear", "fig", "plum"]));
}
```

```text
9
2.5
plum
```

One definition now serves integers, floats and strings. Within a single call, `T` is one type:
you cannot pass a slice that mixes integers and strings.

## Generic structs and enums

Types take parameters too. You have used two generic enums since the Basic level. The standard
library declares them as `enum Option<T> { Some(T), None }` and
`enum Result<T, E> { Ok(T), Err(E) }`. `Option<T>` is "a `T` or nothing" for any `T`.
`Result<T, E>` has two parameters because the success value and the error are unrelated types.
Your own types can do the same. An enum such as `enum Cached<T> { Fresh(T), Stale(T), Missing }`
is one definition that works for a cached value of any type, and a generic struct looks like
this:

```rust
struct Pair<A, B> {
    first: A,
    second: B,
}

impl<A, B> Pair<A, B> {
    fn swap(self) -> Pair<B, A> {
        Pair { first: self.second, second: self.first }
    }

    // `C` belongs to this method only.
    fn with_second<C>(self, second: C) -> Pair<A, C> {
        Pair { first: self.first, second }
    }
}

// Only pairs of two f64 values get this method.
impl Pair<f64, f64> {
    fn total(&self) -> f64 {
        self.first + self.second
    }
}

fn main() {
    let pair = Pair { first: "width", second: 30 };
    let swapped = pair.swap();
    println!("{} {}", swapped.first, swapped.second);

    let flagged = swapped.with_second(true);
    println!("{} {}", flagged.first, flagged.second);

    let point = Pair { first: 1.5, second: 2.0 };
    println!("{}", point.total());
}
```

```text
30 width
30 true
3.5
```

## Methods on generic types

The example shows the three forms an `impl` block can take.

- `impl<A, B> Pair<A, B>` declares the parameters after `impl` and then uses them. Without that
  declaration the compiler would look for concrete types named `A` and `B`. These methods exist
  for every `Pair`.
- A method can add parameters of its own, as `with_second<C>` does.
- `impl Pair<f64, f64>` names concrete types, so `total` exists only for that one kind of pair.
  Calling `total` on a `Pair<&str, i32>` is a compile error, because no such method exists for
  that type.

If a struct uses one parameter for two fields, as in `struct Same<T> { left: T, right: T }`, both
fields must have the same type. `Same { left: 1, right: 2.5 }` fails with
`error[E0308]: mismatched types ... expected integer, found floating-point number`.

## Telling the compiler which type you mean

Usually the compiler infers type parameters from the arguments. When nothing pins the type down,
you must say it, either with an annotation or with the **turbofish** `::<...>` placed after the
function name.

```rust
fn main() {
    let count = "42".parse::<u32>().unwrap(); // turbofish
    let total: u64 = "7".parse().unwrap();     // annotation
    let empty = Vec::<String>::new();
    println!("{count} {total} {}", empty.len());
}
```

```text
42 7 0
```

`parse` can produce many types, so `let count = "42".parse().unwrap();` alone is rejected with
`error[E0284]: type annotations needed`.

## What the compiler does: monomorphization

Generics cost nothing at run time. For every concrete type a generic item is used with, the
compiler generates a separate, specialized copy, as if you had written `largest_i32`,
`largest_f64` and `largest_str` by hand. This is **monomorphization**. Each copy is ordinary code
that the optimizer can inline, so a generic function runs as fast as the hand-written version.
The price is paid elsewhere: more copies mean a larger executable and a longer compile.

## Common mistakes

- **Using an ability the bound does not grant.** Printing a `T` with `{}`, comparing it or
  cloning it all need a bound. Read the `help` line: it usually names the missing trait.
- **Writing `impl Pair<A, B>` without `impl<A, B>`.** The compiler reports that it cannot find
  types `A` and `B`.
- **Expecting one parameter to stand for two types.** One `T` is one type per use. Use two
  parameters when the types may differ.
- **Adding type parameters you do not need.** If a function only ever handles `u32`, write
  `u32`. Generics are for code that is truly the same across types.

## Practice

1. Write `fn first_or<T>(items: Vec<T>, fallback: T) -> T` that returns the first element, or
   `fallback` when the vector is empty. Does it need a bound?
2. Given `struct Wrapper<T> { value: T }`, add a method `get` that returns a reference to the
   value, for every `T`.
3. Why does `let numbers = Vec::new();` on its own fail to compile, and what are two ways to
   fix it?

### Answers

1. No bound is needed, because the body only moves values of type `T`. One way to write the
   body is `items.into_iter().next().unwrap_or(fallback)`: `into_iter().next()` takes the first
   element out of the vector as an `Option<T>`, and `unwrap_or` supplies the fallback for `None`.
2. `impl<T> Wrapper<T> { fn get(&self) -> &T { &self.value } }`.
3. Nothing tells the compiler what `T` is. Write `let numbers: Vec<i32> = Vec::new();` or
   `let numbers = Vec::<i32>::new();`. Pushing a value later in the same function also works,
   because inference looks at the whole function.

## Key takeaways

- A type parameter is a placeholder that every use fills with one concrete type.
- A generic body may only use abilities that its bounds guarantee.
- `impl<T> Type<T>` adds methods for all `T`; `impl Type<f64>` adds them for one type.
- Monomorphization makes generics as fast as hand-written code, at the cost of code size and
  compile time.

## Further reading

- [The Rust Programming Language: Generic Data Types](https://doc.rust-lang.org/book/ch10-01-syntax.html)
- [Rust by Example: Generics](https://doc.rust-lang.org/rust-by-example/generics.html)
