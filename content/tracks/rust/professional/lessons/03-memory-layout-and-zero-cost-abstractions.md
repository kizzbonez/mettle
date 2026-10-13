---
title: Memory Layout and Zero-Cost Abstractions
summary: How Rust lays out structs, enums and pointers in memory, and what "zero cost" really promises about generics, closures and iterators.
minutes: 25
objectives:
  - Predict the size and alignment of a struct under the default and the `C` representation
  - Explain why `Option<&T>` and `Option<NonZeroU32>` need no extra space
  - Tell a thin pointer from a wide pointer and say what the second word holds
  - Choose between static and dynamic dispatch and name the cost of each
---

## Outline

1. Size, alignment and padding
2. Choosing a representation with `repr`
3. Enums and niches
4. Thin and wide pointers
5. Static and dynamic dispatch
6. What "zero cost" means

## Size, alignment and padding

Every type has a **size**, the number of bytes one value occupies, and an **alignment**: a
value's address must be a multiple of it, and it is always a power of two. Size is always a
multiple of alignment. To keep each field aligned, a struct may contain **padding**, bytes
that hold nothing.

```rust
use std::mem::{align_of, size_of};

#[allow(dead_code)]
struct Reordered {
    flag: u8,
    count: u32,
    code: u16,
}

#[allow(dead_code)]
#[repr(C)]
struct Declared {
    flag: u8,
    count: u32,
    code: u16,
}

#[allow(dead_code)]
#[repr(C, packed)]
struct Packed {
    flag: u8,
    count: u32,
    code: u16,
}

fn main() {
    println!("{} {}", size_of::<u32>(), align_of::<u32>());
    println!("{} {}", size_of::<Reordered>(), align_of::<Reordered>());
    println!("{} {}", size_of::<Declared>(), align_of::<Declared>());
    println!("{} {}", size_of::<Packed>(), align_of::<Packed>());
}
```

```text
4 4
8 4
12 4
7 1
```

The three fields need 7 bytes. `Declared` keeps them in the written order: `flag` at offset
0, three bytes of padding so that `count` starts at 4, `code` at 8, and two more bytes so that
the size is a multiple of 4. That makes 12. `Reordered` uses the default representation, which
lets the compiler put the fields in any order, and it found one that fits in 8.

## Choosing a representation with `repr`

- **Default.** Field order is unspecified and may change between compiler versions. Never
  rely on it for FFI, file formats or reinterpreting bytes.
- **`repr(C)`.** Declaration order with C's padding rules. Use it when the layout must be
  predictable.
- **`repr(transparent)`.** A struct with one field of non-zero size has exactly that field's
  layout and ABI. It suits a newtype that crosses an FFI boundary.
- **`repr(u8)`** and the other integer types fix the type of an enum's tag.
- **`repr(packed)`** removes padding by lowering the alignment to 1. Fields are then
  misaligned, so taking a reference to one is a compile error (E0793) and the field must be
  copied out. It belongs in wire formats, not in ordinary code.
- **`repr(align(N))`** raises the alignment, for example to 64, a common cache-line size, so
  that two busy values never share a line.

## Enums and niches

An enum must record which variant it holds. That record is the **discriminant** or tag.
`Option<u32>` therefore takes 8 bytes: 4 for the number, and 4 more because the tag needs
room and the size must stay a multiple of the alignment. But when the payload type has a bit
pattern that is never a valid value, called a **niche**, the compiler stores the tag there.
A reference is never null, so `Option<&T>` uses null for `None`.

```rust
use std::mem::size_of;
use std::num::NonZeroU32;

#[allow(dead_code)]
enum Message {
    Ping,
    Text(String),
    Snapshot([u64; 16]),
}

#[allow(dead_code)]
enum Slim {
    Ping,
    Text(String),
    Snapshot(Box<[u64; 16]>),
}

fn main() {
    println!("{} {}", size_of::<u32>(), size_of::<Option<u32>>());
    println!("{} {}", size_of::<NonZeroU32>(), size_of::<Option<NonZeroU32>>());
    println!("{} {}", size_of::<&u8>(), size_of::<Option<&u8>>());
    println!("{} {}", size_of::<Box<u8>>(), size_of::<Option<Box<u8>>>());
    println!("{} {}", size_of::<bool>(), size_of::<Option<bool>>());
    println!("{} {}", size_of::<Message>(), size_of::<Slim>());
}
```

```text
4 8
4 4
8 8
8 8
1 1
136 24
```

The standard library **guarantees** that `Option<T>` is the size of `T` for references,
`Box`, `NonNull`, function pointers and the `NonZero` integers. That is why a capacity of
type `NonZeroUsize` costs nothing extra when it is optional. Other cases, such as the
one-byte `Option<bool>` above, are what today's compiler does, not a promise.

The last line shows a second rule: an enum is as large as its largest variant. Boxing a
large, rare variant shrank every `Message` from 136 bytes to 24, at the price of one heap
allocation when that variant is built.

## Thin and wide pointers

A pointer to a type whose size is known at compile time is one machine word: a **thin**
pointer. A pointer to a dynamically sized type carries a second word and is called **wide**
(or fat). For a slice or `str` the second word is the length. For `dyn Trait` it points to
the **vtable**: a table generated for the concrete type, holding its size, alignment,
destructor and the addresses of its trait methods.

## Static and dynamic dispatch

A generic function is compiled by **monomorphization**: the compiler emits a separate copy
for every concrete type it is used with. Each call is resolved at compile time and can be
inlined. A function that takes `&dyn Trait` is compiled once, and every method call looks the
address up in the vtable. A vtable has one slot per method, which is why a trait with a
generic method cannot be used as `dyn Trait`: it would need a slot for every possible type.

```rust
use std::fmt::Display;
use std::mem::{size_of, size_of_val};

struct Meters(f64);

/// Static dispatch: one copy of this function is compiled per type used.
fn show_static<T: Display>(value: T) -> String {
    format!("<{value}>")
}

/// Dynamic dispatch: one copy, which finds `fmt` through a vtable at run time.
fn show_dynamic(value: &dyn Display) -> String {
    format!("<{value}>")
}

fn main() {
    println!("{} {}", size_of::<&u64>(), size_of::<Box<u64>>());
    println!("{} {}", size_of::<&[u64]>(), size_of::<&str>());
    println!("{} {}", size_of::<&dyn Display>(), size_of::<Box<dyn Display>>());

    let limit = 10;
    let plain = |x: i32| x + 1; // captures nothing
    let capturing = move |x: i32| x + limit; // captures one i32
    println!("{} {}", size_of_val(&plain), size_of_val(&capturing));
    println!("{} {}", size_of::<Meters>(), size_of::<f64>());
    let evens = (0..10_u32).filter(|n| n % 2 == 0).map(|n| n * n);
    println!("{}", size_of_val(&evens));
    println!("{} {} {}", evens.sum::<u32>(), plain(1), capturing(1));

    println!("{} {}", show_static(7), show_static("seven"));
    println!("{} {}", show_dynamic(&7), show_dynamic(&"seven"));
    let _ = Meters(1.0).0;
}
```

```text
8 8
16 16
16 16
0 4
8 8
8
120 2 11
<7> <seven>
<7> <seven>
```

The trade-off: static dispatch gives the fastest code but a bigger binary and longer builds,
because every instantiation is compiled separately. Dynamic dispatch gives one copy of the
code and allows a mixed collection such as `Vec<Box<dyn Shape>>`, for an indirect call that
the optimizer usually cannot inline.

## What "zero cost" means

A **zero-cost abstraction** compiles to the code you would have written by hand without it.
The sizes above are the evidence. A closure that captures nothing occupies no bytes. The
newtype `Meters` is exactly an `f64`. The `filter` and `map` chain is 8 bytes, which is only
the range it wraps: no heap, no hidden pointers.

The phrase has limits:

- It describes **optimized** builds. Without optimization every small layer is a real call.
- It describes **run time**. Monomorphization is paid for in compile time and binary size.
- It does not cover everything. `dyn` calls, reference counts in `Rc`, borrow flags in
  `RefCell`, bounds checks and `clone()` all cost something.

## Common mistakes

- **Relying on field order without `repr(C)`**, for instance when writing a struct's bytes to
  a file.
- **Using `repr(packed)` to save memory in ordinary code.** Reordering fields usually gets
  the same saving without misaligned access.
- **Assuming `Option<T>` is always free.** `Option<u32>` is twice the size of `u32`.
- **Reaching for `Box<dyn Trait>` by default**, or for generics by default. One costs
  indirect calls and allocations, the other costs code size. Pick per case.
- **Judging an abstraction's cost in a debug build.**

## Practice

1. Predict `size_of` for `#[repr(C)] struct Wasteful { a: u8, b: u64, c: u8 }`. Reorder the
   fields to make it smaller. What size does the default representation give?
2. Which is larger, `Option<Box<u8>>` or `Option<u64>`, and why?
3. `fn total(items: &[Box<dyn Shape>]) -> f64` and `fn total<S: Shape>(items: &[S]) -> f64`
   both sum `area()`. Which accepts circles and squares together? Which can inline `area`?

### Answers

1. 24 bytes: `a` at 0, seven bytes of padding, `b` at 8, `c` at 16, then seven more bytes so
   that the size is a multiple of 8. Declaring `b` first gives 16. The default representation
   also gives 16, because the compiler does the reordering for you.
2. `Option<u64>` is 16 bytes and `Option<Box<u8>>` is 8. Every bit pattern of a `u64` is a
   valid number, so the tag needs space of its own, and the size must be a multiple of the
   alignment, 8. A `Box` is never null, so null means `None`.
3. The `dyn` version accepts a mixture, because each element carries its own vtable pointer.
   The generic version requires one type `S` for the whole slice, and in exchange the compiler
   knows exactly which `area` is called and can inline it.

## Key takeaways

- Size is a multiple of alignment, and padding fills the gaps. The default representation may
  reorder fields, and `repr(C)` may not.
- Niches let `Option` of a reference, a `Box` or a `NonZero` integer cost nothing.
- An enum is as large as its largest variant.
- Wide pointers carry a length or a vtable pointer.
- Zero cost means no run-time overhead in optimized builds. Compile time and binary size are
  where generics are paid for.

## Further reading

- [The Rust Reference: Type layout](https://doc.rust-lang.org/reference/type-layout.html)
- [Standard library: `Option` representation](https://doc.rust-lang.org/std/option/index.html)
- [The Rustonomicon: Data layout](https://doc.rust-lang.org/nomicon/repr-rust.html)
- [The Rust Performance Book: Type sizes](https://nnethercote.github.io/perf-book/type-sizes.html)
