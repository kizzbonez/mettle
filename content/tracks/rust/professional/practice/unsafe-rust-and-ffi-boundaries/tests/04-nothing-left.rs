use std::alloc::{GlobalAlloc, Layout, System};
use std::ffi::CStr;
use std::sync::atomic::{AtomicIsize, Ordering};

/// Forwards to the system allocator and counts the blocks that are allocated
/// and not yet freed.
struct Counting;

static LIVE: AtomicIsize = AtomicIsize::new(0);

// SAFETY: both methods forward unchanged to `System`, which upholds the
// `GlobalAlloc` contract, and the counter itself never allocates.
unsafe impl GlobalAlloc for Counting {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        LIVE.fetch_add(1, Ordering::Relaxed);
        unsafe { System.alloc(layout) }
    }
    unsafe fn dealloc(&self, pointer: *mut u8, layout: Layout) {
        LIVE.fetch_sub(1, Ordering::Relaxed);
        unsafe { System.dealloc(pointer, layout) }
    }
}

#[global_allocator]
static GLOBAL: Counting = Counting;

// Standard output allocates its buffer on first use. Do that now, so that a
// `println!` of yours is not mistaken for a leak.
let _ = std::io::stdout();

let names = [c"ada", c"grace hopper", c"lin", c"mira"];
let before = LIVE.load(Ordering::Relaxed);

let log = visitor_log_new();
// SAFETY: `log` is live until `visitor_log_free`, the names are C string
// literals, and each badge is read before it is freed once.
unsafe {
    for round in 0..50 {
        for name in names {
            assert!(visitor_log_add(log, name.as_ptr()) == 0, "valid names are accepted");
        }
        let badge = visitor_log_last(log);
        assert!(
            !badge.is_null() && CStr::from_ptr(badge).to_bytes() == b"MIRA",
            "the last badge is the badge of the latest visitor"
        );
        let with_badge = LIVE.load(Ordering::Relaxed);
        visitor_badge_free(badge);
        assert!(
            LIVE.load(Ordering::Relaxed) == with_badge - 1,
            "visitor_badge_free gives the badge's memory back to the allocator, in round {round}"
        );
    }
    assert!(
        LIVE.load(Ordering::Relaxed) > before,
        "the log holds memory while it is alive"
    );
    visitor_log_free(log);
}

assert!(
    LIVE.load(Ordering::Relaxed) == before,
    "once every badge and the log were freed, none of the memory the library allocated is left"
);
