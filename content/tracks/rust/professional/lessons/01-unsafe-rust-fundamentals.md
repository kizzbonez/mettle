---
title: Unsafe Rust Fundamentals
summary: What the `unsafe` keyword unlocks, what stays checked, and how to put unsafe code behind an interface that safe callers cannot misuse.
minutes: 30
objectives:
  - List the five operations that need `unsafe` and name two checks that stay on inside an `unsafe` block
  - Create raw pointers with `&raw const` and `&raw mut` and dereference them correctly
  - Write a `# Safety` contract and a `// SAFETY:` comment that state and discharge a proof obligation
  - Decide whether a safe function that contains `unsafe` is sound, and say what a clean Miri run does and does not show
---

## Outline

1. What `unsafe` unlocks and what it leaves on
2. Raw pointers
3. Undefined behaviour
4. Contracts: `# Safety` and `// SAFETY:`
5. A safe API around unsafe code
6. What Miri checks

## What `unsafe` unlocks and what it leaves on

Safe Rust promises a program free of undefined behaviour (defined below), and the compiler
proves it. Some correct programs cannot be proved that way: calling C, driving hardware,
implementing `Vec` itself. `unsafe` exists for those. It unlocks exactly five operations:

- dereferencing a raw pointer;
- calling an `unsafe` function or method;
- reading or writing a mutable static (`static mut`);
- implementing an `unsafe` trait;
- reading a field of a `union`.

Nothing is switched off. Inside an `unsafe` block references are still borrow-checked (two
`&mut` to one vector is still error E0499), types are still checked, and `v[i]` still panics
when `i` is out of range.

The keyword works in two directions. `unsafe fn` and `unsafe trait` **declare** an obligation
that the compiler cannot check, for whoever calls or implements them. An `unsafe { }` block
and an `unsafe impl` **discharge** one: the author claims to have checked the rules there.

## Raw pointers

A raw pointer, `*const T` or `*mut T`, is an address with a type and none of a reference's
guarantees. It may be null, may dangle (point at freed memory), may be misaligned, and several
may write to the same place. Nothing is freed when one goes out of scope. Creating a raw
pointer is safe, because a pointer nobody follows harms nothing. Only dereferencing needs
`unsafe`. The raw borrow operators `&raw const` and `&raw mut` make one directly from a place,
without creating a reference first.

```rust
fn main() {
    let mut total = 10_u32;
    let writer = &raw mut total; // *mut u32: creating it is safe
    let reader = writer.cast_const(); // *const u32 to the same place

    // SAFETY: both pointers come from a live, aligned local, and `total`
    // is not touched through any reference while they are in use.
    unsafe {
        *writer += 5;
        println!("{}", *reader);
    }
}
```

```text
15
```

## Undefined behaviour

**Undefined behaviour** (UB) is anything the language places no requirements on. The optimizer
assumes it never happens, so a program that executes UB has no defined meaning: it may crash,
appear to work, or change behaviour after an unrelated edit or a compiler upgrade. The main
kinds:

- reading or writing through a dangling or misaligned pointer, or outside its allocation;
- breaking the aliasing rules: while a `&mut T` is live nothing else may read or write its
  target, and what a `&T` points at must not change (except inside an `UnsafeCell`);
- a data race;
- producing an invalid value: a `bool` that is not 0 or 1, an enum with no matching variant, a
  null reference, an integer read from uninitialized memory;
- calling a function with the wrong ABI (calling convention).

A leak, a deadlock, an integer overflow and a panic are **not** UB. They are bugs that safe
code can also write.

## Contracts: `# Safety` and `// SAFETY:`

Every unsafe operation has preconditions. An `unsafe fn` lists its own under a `# Safety`
heading in its documentation. Every `unsafe` block gets a `// SAFETY:` comment saying why the
preconditions hold right there. Together they are the proof, where a reviewer can check it.

```rust
/// Returns the element at `index` without a bounds check.
///
/// # Safety
///
/// `index` must be less than `items.len()`.
pub unsafe fn nth_unchecked(items: &[u32], index: usize) -> u32 {
    // SAFETY: the caller promises that `index` is in bounds.
    unsafe { *items.as_ptr().add(index) }
}

fn main() {
    let readings = [7, 11, 13];
    // SAFETY: the array has three elements, so index 2 is in bounds.
    let last = unsafe { nth_unchecked(&readings, 2) };
    println!("{last}");
}
```

```text
13
```

In the 2024 edition the body of an `unsafe fn` is not an unsafe block. Leave out the inner
`unsafe { }` and the compiler warns (`unsafe_op_in_unsafe_fn`). The keyword on the function
binds the caller. The blocks inside show which lines need a proof.

## A safe API around unsafe code

A safe function is **sound** if no safe caller, however strange its arguments, can cause UB
through it. If one can, the function is **unsound** and the bug is the function's, not the
caller's. Here the unsafe line relies on an **invariant**, a fact the type keeps true at all
times:

```rust
mod ring {
    /// Keeps the most recent readings, overwriting the oldest.
    pub struct Ring {
        slots: Box<[u32]>,
        next: usize, // invariant: next < slots.len()
    }

    impl Ring {
        pub fn new(size: usize) -> Ring {
            assert!(size > 0, "a ring needs at least one slot");
            Ring { slots: vec![0; size].into_boxed_slice(), next: 0 }
        }

        pub fn push(&mut self, value: u32) {
            // SAFETY: `next < slots.len()` is the type's invariant. `new`
            // establishes it and the line below preserves it.
            unsafe { *self.slots.get_unchecked_mut(self.next) = value };
            self.next = (self.next + 1) % self.slots.len();
        }

        pub fn slots(&self) -> &[u32] {
            &self.slots
        }
    }
}

fn main() {
    let mut ring = ring::Ring::new(3);
    for value in 1..=4 {
        ring.push(value);
    }
    println!("{:?}", ring.slots());
}
```

```text
[4, 2, 3]
```

`push` is sound because of code outside its `unsafe` block. Delete the `assert!` and
`Ring::new(0)` followed by `push` writes out of bounds, although no unsafe line changed. So
the unit to review is the **module**: the fields are private, which means only code in `ring`
can break the invariant. Make `next` public and any caller can set it to 99.

Soundness must also survive a panic. If unsafe code calls a caller's closure while a value
is duplicated (say, after `ptr::read`), a panic in the closure unwinds and drops the value
twice. Restore a valid state before running code you did not write.

## What Miri checks

Miri is an interpreter that runs your program or tests and stops when UB happens. It needs a
nightly toolchain, so it is not in this course's sandbox:

```bash
rustup +nightly component add miri
cargo +nightly miri test
```

It detects out-of-bounds and use-after-free accesses, use of uninitialized data, misaligned
accesses, invalid values, data races and memory leaks, and it has experimental checks for the
aliasing rules. Its limits matter as much: Miri only sees the executions your tests produce,
cannot run most foreign (C) code, and is far slower than native code. A clean run is
evidence, not proof.

## Common mistakes

- **Treating `unsafe` as "checks off".** The borrow checker still runs. Only who vouches for
  the five operations changes.
- **One large `unsafe` block.** Every line inside is a line a reviewer must prove.
- **A safe function that trusts its arguments.** If a wrong index from safe code can reach an
  unchecked operation, check it or make the function an `unsafe fn`.
- **Public invariant fields.** Privacy is what limits the code you have to audit.

## Practice

1. Which of the lines (a), (b) and (c) needs `unsafe`, and why only that one?

   ```rust
   let value = 5_u32;
   let pointer = &raw const value; // (a)
   let address = pointer as usize; // (b)
   let copy = *pointer;            // (c)
   ```

2. A library exports the function below. Is it sound? Repair it in two different ways.

   ```rust
   pub fn byte_at(items: &[u8], index: usize) -> u8 {
       unsafe { *items.get_unchecked(index) }
   }
   ```

3. Write `first_and_last_mut(items: &mut [u32]) -> Option<(&mut u32, &mut u32)>`. It returns
   mutable references to the first and last elements, or `None` for fewer than two elements.
   Include the `// SAFETY:` comment.

### Answers

1. Only (c). Making a raw pointer or turning it into a number harms nothing. Dereferencing
   trusts that the pointer is valid, which the compiler cannot check.

2. It is unsound: `byte_at(&[], 0)` is safe code that reads out of bounds. Either keep it safe
   by checking `index < items.len()` and returning `Option<u8>` (as
   `items.get(index).copied()` does), or make it `pub unsafe fn byte_at_unchecked` with a
   `# Safety` section, which moves the obligation to the caller.

3. The borrow checker rejects two `&mut` into one slice, so the proof is ours:

   ```rust
   pub fn first_and_last_mut(items: &mut [u32]) -> Option<(&mut u32, &mut u32)> {
       let len = items.len();
       if len < 2 {
           return None;
       }
       let start = items.as_mut_ptr();
       // SAFETY: `len >= 2`, so index 0 and index `len - 1` are in bounds
       // and are different elements. The two `&mut` never overlap, and
       // both borrow from `items`, so they cannot outlive it.
       unsafe { Some((&mut *start, &mut *start.add(len - 1))) }
   }
   ```

   With `len < 1` as the check, a one-element slice would yield two `&mut` to the same
   element, which is UB.

## Key takeaways

- `unsafe` unlocks five operations and disables no checks. The proof becomes yours.
- Creating a raw pointer is safe. Dereferencing it is the promise.
- UB is not a crash. It removes every guarantee about what the program does.
- `# Safety` states the contract, `// SAFETY:` shows it is met, and private fields keep the
  invariant inside one module.
- Miri finds UB in the executions you run and proves nothing about the rest.

## Further reading

- [The Rust Programming Language: Unsafe Rust](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html)
- [The Rust Reference: Behavior considered undefined](https://doc.rust-lang.org/reference/behavior-considered-undefined.html)
- [The Rustonomicon: Working with Unsafe](https://doc.rust-lang.org/nomicon/working-with-unsafe.html)
- [Miri, the undefined behaviour detector](https://github.com/rust-lang/miri)
