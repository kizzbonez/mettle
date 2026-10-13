---
title: Unsafe Rust and FFI Boundaries
summary: What `unsafe` actually permits, how to hide it behind an interface that cannot be misused, and how to hand data to foreign code.
minutes: 35
objectives:
  - List what `unsafe` allows and what it leaves checked
  - Decide whether a safe function that contains `unsafe` is sound
  - Call a C function through a safe wrapper with a `SAFETY` justification
  - State who owns and who frees memory that crosses an FFI boundary
---

## Outline

1. What `unsafe` does and does not do
2. Safe abstractions and soundness
3. Crossing the FFI boundary
4. Keeping unsafe code honest

## What `unsafe` does and does not do

The `unsafe` keyword unlocks five things: dereferencing a raw pointer, calling an `unsafe`
function, accessing a mutable static, implementing an `unsafe` trait, and reading a union
field. It turns nothing off. References inside an `unsafe` block are borrow-checked as usual.

What changes is who vouches for the code: you, not the compiler. Get it wrong and you have
**undefined behavior**, which the optimizer assumes never happens.

## Safe abstractions and soundness

Wrap `unsafe` in an interface that cannot be misused. A safe function is **sound** if no safe
caller, however careless, can trigger undefined behavior through it.

```rust
/// Splits a slice in two at `mid`.
pub fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    assert!(mid <= len, "mid is out of bounds");
    let ptr = slice.as_mut_ptr();
    // SAFETY: `mid <= len`, so both ranges lie inside the slice, and they do
    // not overlap, so the two `&mut` never alias.
    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}
```

Without the `assert!` this still compiles, but a safe caller could create an out-of-bounds
slice. That bug would be here, not in the caller. Panics matter too: if a callback panics
while your structure is half-updated, unwinding drops it in that state.

## Crossing the FFI boundary

Foreign code knows nothing about ownership or lifetimes. You translate at the edge.

```rust
use std::ffi::{c_char, CStr, CString};

// Edition 2024 spells this `unsafe extern "C"`.
extern "C" {
    fn strlen(s: *const c_char) -> usize;
}

/// `&CStr` guarantees a valid, NUL-terminated string.
pub fn c_length(text: &CStr) -> usize {
    // SAFETY: the pointer is valid and NUL-terminated for the whole call, and
    // `strlen` only reads.
    unsafe { strlen(text.as_ptr()) }
}

fn main() {
    let name = CString::new("mettle").expect("no interior NUL byte");
    assert_eq!(c_length(&name), 6);
}
```

- Give shared structs `#[repr(C)]`; Rust's default layout is unspecified.
- `as_ptr()` lends a pointer that dies with its owner. `into_raw()` hands ownership over, and
  must be matched by `from_raw()`.
- Memory is freed by the side that allocated it.
- A panic must not unwind into foreign code; catch it and return an error code.

## Keeping unsafe code honest

- Keep `unsafe` blocks small, each with a `// SAFETY:` comment that justifies it.
- Make the fields an invariant depends on private, so only one module can break it.
- Test under Miri, an interpreter that detects many kinds of undefined behavior.

## Key takeaways

- `unsafe` grants five powers and disables no checks; the proof is yours.
- A safe API must be sound for every input, including a callback that panics.
- At an FFI boundary, be explicit about layout, ownership and who frees.
- Small blocks, `SAFETY` comments and private fields keep it reviewable.
