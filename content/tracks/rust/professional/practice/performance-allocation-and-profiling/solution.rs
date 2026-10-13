//! Night Export
//!
//! Three small functions from the hot loop of an order export. Each one does
//! the same work as the version in production, with the allocations that the
//! profile pointed at removed.

use std::alloc::{GlobalAlloc, Layout, System};
use std::borrow::Cow;
use std::fmt::Write;
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

/// How many times `work` asked the allocator for memory. A buffer that grows
/// counts once for every time it grows.
pub fn allocations(work: impl FnOnce()) -> usize {
    let before = ALLOCATIONS.load(Ordering::Relaxed);
    work();
    ALLOCATIONS.load(Ordering::Relaxed) - before
}

// ---- What production runs today: correct, and wasteful. ----

/// One `String` for each id, a `Vec` to hold them, and one more for the result.
pub fn join_ids_before(ids: &[u32]) -> String {
    ids.iter().map(|id| id.to_string()).collect::<Vec<String>>().join(",")
}

/// A new `String` for every SKU, although most arrive clean.
pub fn clean_sku_before(sku: &str) -> String {
    sku.trim().to_ascii_uppercase()
}

/// A new `String` for every line of the export.
pub fn line_before(order: u32, sku: &str, quantity: u32) -> String {
    format!("order={order} sku={sku} qty={quantity}")
}

// ---- The same work with the allocations removed. ----

/// The ids separated by commas, built in one buffer of the right size.
pub fn join_ids(ids: &[u32]) -> String {
    // A `u32` has at most 10 digits, and each id but the last has a comma.
    let mut joined = String::with_capacity(ids.len() * 11);
    for (index, id) in ids.iter().enumerate() {
        if index > 0 {
            joined.push(',');
        }
        write!(joined, "{id}").expect("writing to a String cannot fail");
    }
    joined
}

/// The SKU without surrounding whitespace and with its ASCII letters in upper
/// case. Borrows from the input when the trimmed text is already clean.
pub fn clean_sku(sku: &str) -> Cow<'_, str> {
    let trimmed = sku.trim();
    if trimmed.bytes().any(|byte| byte.is_ascii_lowercase()) {
        Cow::Owned(trimmed.to_ascii_uppercase())
    } else {
        Cow::Borrowed(trimmed)
    }
}

/// Replaces the content of `line` with one line of the export. The buffer
/// keeps its capacity, so a caller that reuses it stops allocating.
pub fn write_line(line: &mut String, order: u32, sku: &str, quantity: u32) {
    line.clear();
    write!(line, "order={order} sku={sku} qty={quantity}").expect("writing to a String cannot fail");
}
