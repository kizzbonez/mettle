---
title: Performance, Allocation and Profiling
summary: Measure before changing anything, remove the allocations that matter, and know where zero-cost abstractions stop being free.
minutes: 35
objectives:
  - Set up a measurement that the optimizer cannot invalidate
  - Remove avoidable allocations with capacity, buffer reuse and `Cow`
  - Explain which abstractions cost nothing at run time and which do
  - Relate data layout and algorithmic complexity to observed performance
---

## Outline

1. Measure first
2. Allocation is the usual suspect
3. Zero-cost abstractions and their limits
4. Layout and algorithms

## Measure first

Intuition about performance is wrong often enough that every change starts with a measurement.

- Measure optimized builds (`cargo build --release`). Debug builds tell you little about
  release speed.
- Use a benchmark harness that repeats runs and reports variance. Pass inputs and results
  through `std::hint::black_box`, or the optimizer may delete the work you are timing.
- Profile the real workload with a sampling profiler such as `perf`, and read the result as a
  flame graph. Optimize what is wide.

## Allocation is the usual suspect

One allocation is cheap. One per item in a hot loop is not.

```rust
use std::borrow::Cow;
use std::fmt::Write;

/// Borrows the input when there is nothing to escape, so the common case
/// allocates nothing.
pub fn escape(input: &str) -> Cow<'_, str> {
    if input.contains('&') {
        Cow::Owned(input.replace('&', "&amp;"))
    } else {
        Cow::Borrowed(input)
    }
}

/// Writes into the caller's buffer instead of returning a new `String`.
pub fn render_row(out: &mut String, id: u32, name: &str) {
    out.clear();        // length becomes 0, capacity is kept
    write!(out, "{id},{}", escape(name)).expect("writing to a String cannot fail");
}

fn main() {
    let mut line = String::with_capacity(64);       // sized once, up front
    for (id, name) in [(1, "nuts"), (2, "nuts & bolts")] {
        render_row(&mut line, id, name);
        println!("{line}");
    }
}
```

The same ideas apply everywhere: `Vec::with_capacity` when the size is known, `&str` and slices
in place of clones, and one `collect` at the end of an iterator chain, not a temporary `Vec`
per step.

## Zero-cost abstractions and their limits

Iterators, closures, generics and newtypes compile to the code you would write by hand:
generics are monomorphized and small functions are inlined. Iterating a slice also avoids the
bounds check that `v[i]` may need.

The limits are worth knowing. A call through `dyn Trait` is indirect and cannot be inlined.
`clone()` and `to_string()` are never free. And "zero-cost" is about run time: heavy use of
generics is paid for in compile time and binary size.

## Layout and algorithms

Memory access patterns often dominate. A `Vec` of plain structs is one contiguous block, while
a `Vec<Box<T>>` or a linked list costs a pointer chase per element. Many pointer-based
structures can keep their nodes in a `Vec` and link them by index: fewer allocations, better
locality, and no `unsafe`.

No tuning beats the right algorithm. Replacing a linear scan with a hash lookup turns O(n)
into O(1), and the gain grows with the data.

## Key takeaways

- Measure release builds and profile before you optimize.
- Allocate once, reuse buffers, and borrow where you can.
- Generics and iterators are free at run time; dynamic dispatch and cloning are not.
- Fix the algorithm and the data layout before the instructions.
