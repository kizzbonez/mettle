---
title: Trait Objects and Dynamic Dispatch
summary: Store values of different types behind one trait with `dyn Trait`, see what that costs compared with generics, and learn when an enum is the better tool.
minutes: 25
objectives:
  - Build a collection of different types with `Box<dyn Trait>`
  - Explain the difference between static and dynamic dispatch and what each costs
  - Read a "not dyn compatible" error and change a trait so that it can be used as an object
  - Choose between a trait object, a generic and an enum for a given problem
---

## Outline

1. One list, several types
2. What a trait object is
3. Static and dynamic dispatch
4. Which traits can be made into objects
5. Closures as trait objects
6. Trait object or enum?

## One list, several types

A `Vec<T>` holds values of one type. A generic function such as `fn run<C: Check>(c: &C)` accepts any type that implements `Check`, but each call still settles on a single type. Neither helps when you want a list that mixes several types sharing a behaviour: health checks, shapes, plugins. A **trait object**, written `dyn Trait`, does.

```rust
trait Check {
    fn name(&self) -> String;
    fn passed(&self) -> bool;
}

struct DiskSpace {
    free_gb: u32,
}

struct Ping {
    millis: u32,
}

impl Check for DiskSpace {
    fn name(&self) -> String {
        String::from("disk")
    }
    fn passed(&self) -> bool {
        self.free_gb >= 10
    }
}

impl Check for Ping {
    fn name(&self) -> String {
        String::from("ping")
    }
    fn passed(&self) -> bool {
        self.millis < 200
    }
}

fn failures(checks: &[Box<dyn Check>]) -> Vec<String> {
    checks.iter().filter(|c| !c.passed()).map(|c| c.name()).collect()
}

fn run_static<C: Check>(check: &C) -> bool {
    check.passed()
}

fn run_dynamic(check: &dyn Check) -> bool {
    check.passed()
}

fn main() {
    let checks: Vec<Box<dyn Check>> =
        vec![Box::new(DiskSpace { free_gb: 4 }), Box::new(Ping { millis: 35 })];
    println!("{:?}", failures(&checks));

    let ping = Ping { millis: 250 };
    println!("{} {}", run_static(&ping), run_dynamic(&ping));
    println!("{} {}", size_of::<&Ping>(), size_of::<&dyn Check>());
}
```

```text
["disk"]
false false
8 16
```

## What a trait object is

`dyn Check` means "a value of some type that implements `Check`, and that is all we know". Different implementers have different sizes, so `dyn Check` itself has no fixed size and must always sit behind a pointer: `&dyn Check`, `Box<dyn Check>`, `Rc<dyn Check>`.

That pointer is twice as wide as a normal one, which is the `8 16` above. It holds the address of the value and the address of a **vtable**: a table, built by the compiler for each implementing type, that lists the addresses of that type's methods. Writing `Box::new(Ping { .. })` where a `Box<dyn Check>` is expected converts one into the other automatically.

## Static and dynamic dispatch

*Dispatch* is how a call finds the code to run.

- `run_static` uses **static dispatch**. The compiler generates a separate copy of the function for every type it is called with (this is called monomorphization), so each call goes straight to the right method and can be inlined. The cost is more generated code.
- `run_dynamic` uses **dynamic dispatch**. One copy exists. Each call reads the method's address from the vtable at run time. That costs a little per call and prevents inlining, but it is the only form that works when the concrete type is not known until the program runs.

Use generics by default. Reach for `dyn` when you need mixed types in one collection, or when you want to keep a type out of a struct's signature.

## Which traits can be made into objects

A vtable entry must be one concrete function. A trait is **dyn compatible** (older texts say "object safe") only if every method can be called without knowing the concrete type:

- no method mentions `Self` outside its receiver, so no `-> Self` and no `other: &Self`;
- no method has generic type parameters;
- every method has a receiver such as `&self`, `&mut self` or `self: Box<Self>`;
- the trait does not require `Self: Sized` and has no associated constants.

```rust
trait Shape {
    fn area(&self) -> f64;
    fn scaled(&self, factor: f64) -> Self;
}

fn total_area(shapes: &[Box<dyn Shape>]) -> f64 {
    shapes.iter().map(|s| s.area()).sum()
}
```

```text
error[E0038]: the trait `Shape` is not dyn compatible
 --> src/main.rs:6:29
  |
6 | fn total_area(shapes: &[Box<dyn Shape>]) -> f64 {
  |                             ^^^^^^^^^ `Shape` is not dyn compatible
  |
note: for a trait to be dyn compatible it needs to allow building a vtable
      for more information, visit <https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility>
 --> src/main.rs:3:38
  |
1 | trait Shape {
  |       ----- this trait is not dyn compatible...
2 |     fn area(&self) -> f64;
3 |     fn scaled(&self, factor: f64) -> Self;
  |                                      ^^^^ ...because method `scaled` references the `Self` type in its return type
  = help: consider moving `scaled` to another trait
```

The note names the method and the reason. `scaled` returns a value whose size depends on the hidden type, so no single vtable entry can describe it. Besides moving the method, you can exclude it from trait objects with `where Self: Sized`:

```rust
trait Shape {
    fn area(&self) -> f64;
    fn scaled(&self, factor: f64) -> Self
    where
        Self: Sized;
}
```

Now `Box<dyn Shape>` compiles. `scaled` stays available on concrete types and is refused on the object. `Box<dyn Clone>` is impossible for the same reason: `clone` returns `Self`, so `Clone` requires `Self: Sized`.

## Closures as trait objects

Every closure has its own unnamed type, so a list of different closures needs trait objects of `Fn`, `FnMut` or `FnOnce`:

```rust
fn main() {
    let bonus = 10;
    let steps: Vec<Box<dyn Fn(i32) -> i32>> = vec![
        Box::new(|n| n * 2),
        Box::new(move |n| n + bonus),
        Box::new(i32::abs),
    ];
    let result = steps.iter().fold(-6, |value, step| step(value));
    println!("{result}");
}
```

```text
2
```

A boxed closure is how a program stores "work to do later". The lab for this level queues jobs of type `Box<dyn FnOnce() + Send + 'static>`. The `+ Send` adds a second requirement to the object, explained in the next lesson.

## Trait object or enum?

If you know every variant when you write the code, an enum does the same job without pointers:

```rust
enum Check {
    DiskSpace { free_gb: u32 },
    Ping { millis: u32 },
}

impl Check {
    fn passed(&self) -> bool {
        match self {
            Check::DiskSpace { free_gb } => *free_gb >= 10,
            Check::Ping { millis } => *millis < 200,
        }
    }
}

fn main() {
    let checks = vec![Check::DiskSpace { free_gb: 4 }, Check::Ping { millis: 35 }];
    let passed = checks.iter().filter(|c| c.passed()).count();
    println!("{passed} of {} passed", checks.len());
}
```

```text
1 of 2 passed
```

| | Enum | Trait object |
| --- | --- | --- |
| Set of types | closed, fixed in your crate | open, anyone can add one |
| Adding an operation | one new `match`, checked for completeness | every implementer must change |
| Storage | inline, no allocation | behind a pointer, usually a `Box` |

## Common mistakes

- **Writing `Vec<dyn Check>`.** A `dyn` type has no known size. Put it behind a pointer: `Vec<Box<dyn Check>>` or `Vec<&dyn Check>`.
- **Using `dyn` where a generic would do.** If a function handles one type per call, `impl Trait` or `<T: Trait>` is faster and just as short.
- **Expecting derived behaviour.** A trait object can do only what the trait's methods offer. A `Box<dyn Check>` has no `clone`, no `==` and no `{:?}` output.
- **Trying to get the concrete type back.** A trait object only offers the trait's methods. If you need to match on the kind of value, you wanted an enum.

## Practice

1. Add a check `Uptime { days: u32 }` that passes when `days < 90`, and put it in the vector.
2. Give two ways to make `let checks: Vec<dyn Check> = Vec::new();` compile.
3. `trait Store { fn put<T: Display>(&self, item: T); fn len(&self) -> usize; }` is not dyn compatible. Change `put` so that `&dyn Store` works and `put` can still be called on it.

### Answers

1. Implement the trait and box the value:

   ```rust
   struct Uptime { days: u32 }

   impl Check for Uptime {
       fn name(&self) -> String { String::from("uptime") }
       fn passed(&self) -> bool { self.days < 90 }
   }
   // in main: Box::new(Uptime { days: 120 })
   ```

2. Own each value with `Vec<Box<dyn Check>>`, or borrow each one with `Vec<&dyn Check>`.
3. Replace the generic parameter with a trait object: `fn put(&self, item: &dyn Display);`. Adding `where Self: Sized` would also make the trait dyn compatible, but then `put` could not be called through `&dyn Store`.

## Key takeaways

- `dyn Trait` hides the concrete type. It lives behind a pointer that carries a vtable.
- Generics are resolved at compile time. Trait objects are resolved at run time, one small lookup per call.
- A trait is dyn compatible when its methods make sense without knowing `Self`.
- Different closures in one collection need `Box<dyn Fn(..)>`.
- Closed set of variants: enum. Open set: trait object.

## Further reading

- [The Rust Programming Language: Using Trait Objects to Abstract over Shared Behavior](https://doc.rust-lang.org/book/ch18-02-trait-objects.html)
- [The Rust Reference: Dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility)
- [The Rust Reference: Trait object types](https://doc.rust-lang.org/reference/types/trait-object.html)
