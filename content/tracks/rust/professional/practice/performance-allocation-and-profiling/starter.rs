//! Night Export
//!
//! Three small functions from the hot loop of an order export. The versions
//! in production are correct and allocate far too often. You write the same
//! work with the allocations that the profile pointed at removed.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

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

// ---- What production runs today: correct, and wasteful. Leave these as
// ---- they are, and use them to compare results and to count.

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

// ---- Yours to write: the same work with the allocations removed.

/// The ids separated by commas, built with at most one allocation.
pub fn join_ids(ids: &[u32]) -> String {
    // TODO 1: reserve room for the whole result once, then write into it
    todo!("join_ids")
}

/// The SKU without surrounding whitespace and with its ASCII letters in upper
/// case. Borrows from the input when the trimmed text is already clean.
pub fn clean_sku(sku: &str) -> Cow<'_, str> {
    // TODO 2: `Cow::Borrowed` when nothing has to change, `Cow::Owned` otherwise
    todo!("clean_sku")
}

/// Replaces the content of `line` with one line of the export, without
/// giving up the buffer's capacity.
pub fn write_line(line: &mut String, order: u32, sku: &str, quantity: u32) {
    // TODO 3: empty the buffer and `write!` into it
    todo!("write_line")
}
