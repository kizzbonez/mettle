---
title: Performance, Allocation and Profiling
summary: Measure before changing anything, count and remove the allocations that matter, and know which data layouts and build settings make code fast.
minutes: 30
objectives:
  - Write a timing loop that the optimizer cannot invalidate, and say why a profile comes before any change
  - Count allocations and remove avoidable ones with capacity, buffer reuse and `Cow`
  - Explain how data layout affects cache behaviour, and replace pointers with indices into a `Vec`
  - Apply `#[inline]`, `#[cold]` and release-profile settings and state the trade-off of each
---

## Outline

1. Measure first
2. A measurement the optimizer cannot fool
3. Allocation: count it, then avoid it
4. Cache behaviour and data layout
5. Inlining and build settings

## Measure first

Intuition about speed is wrong often enough that every optimization starts and ends with a
measurement. Three habits:

- **Measure optimized builds** (`cargo build --release`). In this course's sandbox the
  function in the next section took about 7 microseconds per call unoptimized and about 0.3
  with optimization.
- **Profile before you edit.** A **profiler** samples a running program and reports where the
  time goes: `perf` on Linux, Instruments on macOS, `samply` on all three major systems. The
  usual picture is a flame graph, where width is share of time. Optimize what is wide and
  leave the rest readable.
- **Benchmark to compare.** A **benchmark** runs the same work many times and reports the
  time and its spread, so two versions can be compared fairly.

## A measurement the optimizer cannot fool

```rust
use std::hint::black_box;
use std::time::Instant;

fn sum_of_squares(values: &[u64]) -> u64 {
    values.iter().map(|v| v * v).sum()
}

fn main() {
    let values: Vec<u64> = (1..=1_000).collect();
    let rounds = 10_000;

    let started = Instant::now();
    let mut checksum = 0_u64;
    for _ in 0..rounds {
        // `black_box` hides the input and the result from the optimizer.
        checksum = checksum.wrapping_add(black_box(sum_of_squares(black_box(&values))));
    }
    let elapsed = started.elapsed();

    println!("checksum {checksum}");
    eprintln!("{:?} per call", elapsed / rounds);
}
```

```text
checksum 3338335000000
```

The time goes to standard error and differs on every machine and every run. `black_box`
returns its argument unchanged while asking the optimizer to assume nothing about it. Without
it on the input the compiler may work the answer out at compile time. Without it on the
result the compiler may delete the call. It is a best-effort hint, not a guarantee.

A loop like this is a sketch. For real comparisons use a harness such as Criterion. It needs
the `criterion` crate, so this adaptation of its documented example does not run in the
sandbox:

```rust
// benches/squares.rs. Cargo.toml needs `criterion` under [dev-dependencies]
// and a `[[bench]]` entry with `name = "squares"` and `harness = false`.
use criterion::{criterion_group, criterion_main, Criterion};
use std::hint::black_box;

fn bench_squares(c: &mut Criterion) {
    let values: Vec<u64> = (1..=1_000).collect();
    c.bench_function("sum_of_squares", |b| b.iter(|| sum_of_squares(black_box(&values))));
}

criterion_group!(benches, bench_squares);
criterion_main!(benches);
```

`cargo bench` then reports the time as a lower bound, an estimate and an upper bound, and
says whether it changed significantly since the previous run.

## Allocation: count it, then avoid it

A heap allocation typically takes a lock, updates the allocator's bookkeeping and sometimes
makes a system call. One is cheap. One per item in a hot loop often dominates the profile.
You can count them with a global allocator that wraps the system one:

```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::fmt::Write;
use std::hint::black_box;
use std::sync::atomic::{AtomicUsize, Ordering};

/// Forwards every request to the system allocator and counts them.
struct Counting;

static ALLOCATIONS: AtomicUsize = AtomicUsize::new(0);

// SAFETY: both methods forward unchanged to `System`, which upholds the
// `GlobalAlloc` contract, and the counter itself never allocates.
unsafe impl GlobalAlloc for Counting {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        ALLOCATIONS.fetch_add(1, Ordering::Relaxed);
        unsafe { System.alloc(layout) }
    }
    unsafe fn dealloc(&self, pointer: *mut u8, layout: Layout) {
        unsafe { System.dealloc(pointer, layout) }
    }
}

#[global_allocator]
static GLOBAL: Counting = Counting;

/// How many times `work` asked the allocator for memory.
fn allocations(work: impl FnOnce()) -> usize {
    let before = ALLOCATIONS.load(Ordering::Relaxed);
    work();
    ALLOCATIONS.load(Ordering::Relaxed) - before
}

fn main() {
    let grown = allocations(|| {
        let mut ids = Vec::new();
        (0..1000_u32).for_each(|id| ids.push(id));
        black_box(&ids);
    });
    let reserved = allocations(|| {
        let mut ids = Vec::with_capacity(1000);
        (0..1000_u32).for_each(|id| ids.push(id));
        black_box(&ids);
    });
    println!("{grown} {reserved}");

    let fresh = allocations(|| {
        for id in 0..100_u32 {
            black_box(format!("id={id}")); // a new String every time
        }
    });
    let reused = allocations(|| {
        let mut line = String::new();
        for id in 0..100_u32 {
            line.clear(); // length 0, capacity kept
            write!(line, "id={id}").expect("writing to a String cannot fail");
            black_box(&line);
        }
    });
    println!("{fresh} {reused}");
}
```

```text
9 1
100 1
```

A `Vec` that starts empty doubles its buffer as it fills (4, 8, 16 and so on up to 1024), so
1,000 pushes asked the allocator 9 times, and growing can mean copying everything stored so
far. Reserving the capacity asked once. `format!` built 100 strings, and one reused `String` did the same work
with one allocation. The same tools apply everywhere:

- `with_capacity` or `reserve` when the size is known or can be estimated;
- `clear()` and reuse of a buffer across loop iterations;
- `&str` and slices in place of `clone()` and `to_string()`;
- `Cow<'_, str>` as a return type that borrows the input when nothing changed and owns a new
  string only when something did;
- one `collect` at the end of an iterator chain, not a temporary `Vec` per step.

The trade-off is readability, so spend it only where the profile says it pays.

## Cache behaviour and data layout

Main memory is far slower than the processor, so processors keep recently used memory in
small, fast caches and load it a **cache line** at a time (64 bytes on common x86-64 chips).
Code that walks contiguous memory in order finds most of its data already cached. Code that
follows pointers to scattered allocations waits for memory at almost every step.

- A `Vec` of plain structs is one contiguous block. A `Vec<Box<T>>` or a linked list costs a
  pointer chase per element.
- A linked structure does not need pointers. Keep the nodes in a `Vec` and link them by
  index: one allocation, neighbours close together, no `unsafe`, and `u32` links are half
  the size. The price is bookkeeping. A removed node leaves a hole to track for reuse, or
  `swap_remove` fills it in O(1) by moving the last node there, after which every index that
  named the last node must be updated. A stale index is a logic bug the borrow checker
  cannot see.
- Smaller values mean more of them per cache line. Box large, rare enum variants.
- Prefer iterators to index loops. `a[i]` carries a bounds check and a panic path unless the
  optimizer can prove `i` is in range. Iterating, or slicing once before the loop
  (`let b = &b[..a.len()];`), removes the checks from the loop.
- Fix the algorithm first. A hash lookup in place of a linear scan turns O(n) into O(1), and
  no tuning recovers that difference.

## Inlining and build settings

**Inlining** replaces a call with the body of the called function. It removes the call and,
more importantly, lets the optimizer see caller and callee together. The compiler decides by
itself from the function's size, whether it is generic and whether the call crosses a crate
boundary. `#[inline]` suggests inlining, `#[inline(always)]` and `#[inline(never)]` insist
more strongly, and none is a guarantee. `#[cold]` marks a function that is rarely called,
such as an error path, so the hot path stays compact. More inlining means larger code and
longer builds, and can make things slower, so measure.

```toml
[profile.release]
codegen-units = 1            # optimize the crate as one unit: faster code, slower build
lto = "fat"                  # optimize across all crates at link time: slower build still
panic = "abort"              # no unwinding: can be smaller and a little faster, no catch_unwind
debug = "line-tables-only"   # lets a profiler map machine code back to source lines
```

Lesson 9 covers profiles in detail.

## Common mistakes

- **Benchmarking a debug build.**
- **Optimizing without a profile.** The slow part is rarely where you expect.
- **Forgetting `black_box`** and timing code the optimizer removed.
- **`#[inline(always)]` everywhere.** It bloats code and often slows it down.
- **Trusting a microbenchmark alone.** Confirm the gain on the real workload.

## Practice

1. How many times does the allocator get called when 100 `u32` values are pushed into
   `Vec::new()`? And with `Vec::with_capacity(100)`?
2. `fn escape(input: &str) -> String { input.replace('&', "&amp;") }` allocates on every
   call. Rewrite it so that input with nothing to escape allocates nothing.
3. A doubly linked list keeps every node in its own `Box`. Describe an index-based layout,
   give two reasons it is faster, and name one new risk.

### Answers

1. Six times: the capacity goes 4, 8, 16, 32, 64, 128. With `with_capacity(100)`, once.
2. Return a `Cow`:

   ```rust
   use std::borrow::Cow;

   pub fn escape(input: &str) -> Cow<'_, str> {
       if input.contains('&') {
           Cow::Owned(input.replace('&', "&amp;"))
       } else {
           Cow::Borrowed(input)
       }
   }
   ```

   `escape("nuts")` is `Cow::Borrowed`, `escape("nuts & bolts")` is `Cow::Owned`, and both
   deref to `&str`.
3. Store `struct Node { value: T, prev: u32, next: u32 }` in one `Vec<Node>`, with a reserved
   index such as `u32::MAX` meaning "none". All nodes share one allocation, and neighbours in
   the `Vec` share cache lines where boxed nodes are scattered. The risk: once a node is
   removed, an index that still refers to its slot reads whatever lives there now.

## Key takeaways

- Measure release builds, profile first, and benchmark with `black_box` or a harness.
- Allocation in a hot loop is the usual suspect. Count it, then reserve, reuse or borrow.
- Contiguous data beats pointer chasing. Indices into a `Vec` can replace pointers.
- Inlining and release-profile settings trade build time and binary size for speed.
- The right algorithm beats every low-level trick.

## Further reading

- [Standard library: `std::hint::black_box`](https://doc.rust-lang.org/std/hint/fn.black_box.html)
- [The Rust Performance Book: Heap allocations](https://nnethercote.github.io/perf-book/heap-allocations.html)
- [The Rust Performance Book: Profiling](https://nnethercote.github.io/perf-book/profiling.html)
- [Criterion.rs: Getting started](https://criterion-rs.github.io/book/getting_started.html)
