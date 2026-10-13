---
title: Traits and Generics
summary: Describe shared behavior with traits, write code once for many types, and choose how the calls are dispatched.
minutes: 30
objectives:
  - Define a trait with required and default methods and implement it for several types
  - Write generic functions constrained by trait bounds
  - Choose between static dispatch with generics and dynamic dispatch with `dyn Trait`
  - Recognize the standard traits that generic code is built on
---

## Outline

1. Traits describe behavior
2. Generics and trait bounds
3. Static or dynamic dispatch
4. Traits you will meet everywhere

## Traits describe behavior

A trait is a set of methods that a type promises to provide. Required methods have no body.
Default methods have one, and an implementor may override it.

```rust
trait Priced {
    fn cents(&self) -> u64;

    // Default method: every implementor gets it for free.
    fn label(&self) -> String {
        format!("${}.{:02}", self.cents() / 100, self.cents() % 100)
    }
}

struct Coffee;
struct Book {
    cents: u64,
}

impl Priced for Coffee {
    fn cents(&self) -> u64 {
        350
    }
}

impl Priced for Book {
    fn cents(&self) -> u64 {
        self.cents
    }
}
```

You may implement a trait for a type only if your crate defines the trait or the type. This
"orphan rule" stops two crates from supplying conflicting implementations.

## Generics and trait bounds

A generic function works for every type that satisfies its **bounds**.

```rust
fn total<T: Priced>(items: &[T]) -> u64 {
    items.iter().map(|item| item.cents()).sum()
}
```

`T: Priced` is what allows the body to call `cents`. With no bound, almost all you can do with
a `T` is move it or drop it. Long bounds read better in a `where` clause.

## Static or dynamic dispatch

The compiler **monomorphizes** generics: it emits a separate copy of `total` for each concrete
`T`. Every call is direct and can be inlined. The price is code size, and all elements of the
slice must have the same type.

A trait object, `dyn Priced`, erases the type. Calls go through a table of function pointers
(a vtable) at run time, and one collection can hold different types.

```rust
fn receipt(items: &[Box<dyn Priced>]) -> Vec<String> {
    items.iter().map(|item| item.label()).collect()
}

fn main() {
    assert_eq!(total(&[Book { cents: 1200 }, Book { cents: 899 }]), 2099);

    let mixed: Vec<Box<dyn Priced>> = vec![Box::new(Coffee), Box::new(Book { cents: 1200 })];
    assert_eq!(receipt(&mixed), ["$3.50", "$12.00"]);
}
```

Reach for generics first. Use `dyn` when you need mixed types in one collection, or when
smaller binaries and faster builds matter more than the last nanosecond.

## Traits you will meet everywhere

- `Debug`, `Clone`, `PartialEq`, `Default`: usually derived.
- `From` and `Into`: conversions. The `?` operator uses `From` on errors.
- `Iterator`: has an **associated type**, `Item`, that the implementor chooses, not the caller.
- `FromIterator`: what `collect()` calls. Implement it and your type can be built from any
  iterator.

A trait can require another one: `trait Summary: Default` means every `Summary` type also has
`Default::default()`, so generic code can create an empty one.

## Key takeaways

- A trait is a contract; a bound is a requirement that a type meets it.
- Generics are resolved at compile time, one copy per type. `dyn Trait` is resolved at run
  time through a vtable.
- Default methods and supertraits let a small trait offer a lot.
- Implementing standard traits makes your types work with the rest of the language.
