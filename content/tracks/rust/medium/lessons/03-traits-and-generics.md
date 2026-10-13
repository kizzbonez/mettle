---
title: "Traits: Defining Shared Behaviour"
summary: Describe what a type can do with a trait, implement it for several types, and write generic code that asks for exactly the behaviour it needs.
minutes: 30
objectives:
  - Define a trait with required and default methods and implement it for several types
  - Constrain generic code with trait bounds, `impl Trait` and `where` clauses
  - Use a supertrait to require one trait from every implementor of another
  - Explain how a call through `dyn Trait` differs from a call through a generic
---

## Outline

1. Defining and implementing a trait
2. Traits as bounds
3. Supertraits
4. Rules that keep traits predictable
5. A first look at `dyn Trait`

## Defining and implementing a trait

A **trait** is a named set of methods that a type can promise to provide. It describes behaviour
without saying which type has it. A method with no body is *required*: every implementor must
write it. A method with a body is a *default*: implementors get it for free and may replace it.

```rust
trait Priced {
    fn cents(&self) -> u64; // required

    fn label(&self) -> String {
        // default, built on the required method
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

    fn label(&self) -> String {
        format!("book at {} cents", self.cents)
    }
}

fn main() {
    println!("{}", Coffee.label());
    println!("{}", Book { cents: 1200 }.label());
}
```

```text
$3.50
book at 1200 cents
```

`impl Priced for Coffee` reads "Coffee keeps the promise called Priced". `Coffee` uses the
default `label`; `Book` overrides it. A default may call required methods, so one required
method can power several defaults. Inside a trait, `Self` means whichever type implements it,
so a method can take `other: &Self`.

## Traits as bounds

The previous lesson introduced bounds such as `T: PartialOrd`. Your own traits work the same
way. These functions continue the program above and replace its `main`.

```rust
// Any single type that is `Priced`.
fn total<T: Priced>(items: &[T]) -> u64 {
    let mut sum = 0;
    for item in items {
        sum += item.cents();
    }
    sum
}

// The same kind of bound, written as `impl Trait`.
fn cheaper(a: &impl Priced, b: &impl Priced) -> u64 {
    a.cents().min(b.cents())
}

// Several bounds read better in a `where` clause.
fn describe<T, N>(item: &T, name: N) -> String
where
    T: Priced,
    N: std::fmt::Display,
{
    format!("{name}: {} cents", item.cents())
}

fn main() {
    let novel = Book { cents: 1200 };
    println!("{} {}", cheaper(&novel, &Coffee), Coffee.label());
    println!("{}", describe(&novel, "novel"));
    println!("{}", total(&[novel, Book { cents: 899 }]));
}
```

```text
350 $3.50
novel: 1200 cents
2099
```

`&impl Priced` is shorthand for a hidden type parameter. Each `impl Priced` is its own
parameter, so `cheaper` accepts a `Book` and a `Coffee` together. To force two arguments to be
the *same* type, name the parameter: `fn same<T: Priced>(a: &T, b: &T)`. Combine bounds with
`+`, as in `T: Priced + PartialOrd`.

A bound is checked where the function is called. `total(&[5_u32, 7])` fails:

```text
error[E0277]: the trait bound `u32: Priced` is not satisfied
  --> src/main.rs:59:26
   |
59 |     println!("{}", total(&[5_u32, 7]));
   |                    ----- ^^^^^^^^^^^ the trait `Priced` is not implemented for `u32`
   |                    |
   |                    required by a bound introduced by this call
```

E0277 always has the same shape: "type: Trait is not satisfied". Further down, the compiler
points at the bound that made the demand.

`impl Trait` also works as a return type: `fn house_special() -> impl Priced { Coffee }` promises
"some type that is `Priced`" without naming it. The function must still return one concrete
type. Returning `Coffee` in one branch and `Book` in another does not compile.

## Supertraits

A trait can demand another trait from its implementors. `trait Tally: Default` says that every
`Tally` type must also implement `Default`, the standard trait for "a sensible starting value".
`Default` is then a **supertrait** of `Tally`, and generic code may rely on both.

```rust
trait Tally: Default {
    fn add(&mut self, value: u32);
    fn result(&self) -> u32;
}

#[derive(Default)] // writes `Default` for us: `sum` starts at 0
struct Total {
    sum: u32,
}

impl Tally for Total {
    fn add(&mut self, value: u32) {
        self.sum += value;
    }

    fn result(&self) -> u32 {
        self.sum
    }
}

// The caller picks `T`; the supertrait lets us create an empty one.
fn run<T: Tally>(values: &[u32]) -> u32 {
    let mut tally = T::default();
    for &value in values {
        tally.add(value);
    }
    tally.result()
}

fn main() {
    println!("{}", run::<Total>(&[4, 7, 10]));
}
```

```text
21
```

`run` never mentions `Total`. Any type written later, by anyone, works with it as long as it
implements `Tally`. That is the point of traits: code that depends on behaviour, not on a list
of known types. `#[derive(...)]` is the subject of the next lesson.

## Rules that keep traits predictable

- **The orphan rule.** You may implement a trait for a type only if your crate defines the trait
  or the type. `impl std::fmt::Display for Vec<u8>` is rejected with E0117, because both belong
  to the standard library. Without this rule two crates could give the same type two
  conflicting implementations.
- **The trait must be in scope.** To call a trait method, the trait itself must be visible, so a
  trait from another module needs a `use`.
- **All required methods, exact signatures.** Leaving one out is E0046, "not all trait items
  implemented".

## A first look at `dyn Trait`

In `total<T: Priced>`, `T` is one type per call, so a slice cannot mix coffees and books. The
compiler makes a copy of `total` for each `T` and knows exactly which `cents` to call: **static
dispatch**.

A **trait object**, written `dyn Priced`, is a value of *some* type that implements `Priced`,
with the concrete type forgotten. It lives behind a pointer such as `Box`, which owns a value on
the heap.

```rust
fn total_dyn(items: &[Box<dyn Priced>]) -> u64 {
    let mut sum = 0;
    for item in items {
        sum += item.cents();
    }
    sum
}

fn main() {
    let basket: Vec<Box<dyn Priced>> = vec![Box::new(Coffee), Box::new(Book { cents: 1200 })];
    println!("{} {}", total_dyn(&basket), basket[0].label());
}
```

```text
1550 $3.50
```

Here one compiled function serves every type, and each call finds the right `cents` at run
time through a table of function pointers: **dynamic dispatch**. It allows mixed collections at
the cost of an indirect call that cannot be inlined. Reach for generics first. The Advanced
level covers trait objects in depth.

## Common mistakes

- **Calling a method the bound does not include.** Inside `total`, only the methods of `Priced`
  exist for `T`.
- **Returning two types from `-> impl Trait`.** The compiler says the `if` and `else` branches
  have incompatible types.
- **Implementing a foreign trait for a foreign type.** Wrap the type in your own struct and
  implement the trait for the wrapper.

## Practice

1. Add a default method `is_free(&self) -> bool` to `Priced`.
2. Write `fn dearest<T: Priced>(items: &[T]) -> Option<&T>` returning the most expensive item.
3. `fn show(a: &impl Priced, b: &impl Priced)` and `fn show<T: Priced>(a: &T, b: &T)`: which one
   accepts a `Coffee` and a `Book` together?

### Answers

1. Inside the trait: `fn is_free(&self) -> bool { self.cents() == 0 }`. Every implementor has
   it at once.
2. Keep the best item so far in an `Option<&T>`. For each item, replace it when the option is
   `None` or when `item.cents()` is larger than the current best's. An empty slice gives `None`.
3. The first. Its two `impl Priced` are separate hidden parameters. The second requires both
   arguments to be the same type `T`.

## Key takeaways

- A trait is a contract: required methods to write, default methods for free.
- A bound (`T: Trait`, `impl Trait` or a `where` clause) lets generic code use the trait's
  methods and nothing else.
- A supertrait adds a requirement to every implementor.
- Generics dispatch at compile time, one copy per type; `dyn Trait` dispatches at run time and
  can mix types.

## Further reading

- [The Rust Programming Language: Defining Shared Behavior with Traits](https://doc.rust-lang.org/book/ch10-02-traits.html)
- [Rust by Example: Traits](https://doc.rust-lang.org/rust-by-example/trait.html)
