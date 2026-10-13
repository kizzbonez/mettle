//! Front Desk Kiosk
//!
//! A visitor log written in Rust for a kiosk whose firmware is C. The kiosk
//! holds the log as an opaque handle, passes names as C strings and gets
//! badges back as C strings that it must hand back to be freed.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::ffi::{CStr, CString, c_char};
use std::panic::catch_unwind;
use std::ptr;

/// The visitor log. C never looks inside: it only holds a pointer to one.
pub struct VisitorLog {
    badges: Vec<String>,
}

/// The text printed on a visitor's badge. Another team wrote it.
///
/// # Panics
///
/// Panics if the name is blank.
fn badge_text(name: &str) -> String {
    let name = name.trim();
    assert!(!name.is_empty(), "a badge needs a name");
    name.to_uppercase()
}

/// Creates an empty log. The caller owns it and must pass it to
/// `visitor_log_free`.
#[unsafe(no_mangle)]
pub extern "C" fn visitor_log_new() -> *mut VisitorLog {
    Box::into_raw(Box::new(VisitorLog { badges: Vec::new() }))
}

/// Adds a visitor. Returns 0 on success, -1 if `log` or `name` is null, -2 if
/// the name is not UTF-8 and -3 if `badge_text` panicked.
///
/// # Safety
///
/// `log` must be null or a live pointer from `visitor_log_new` that nothing
/// else is using. `name` must be null or point to a NUL-terminated string
/// that stays valid for the whole call.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn visitor_log_add(log: *mut VisitorLog, name: *const c_char) -> i32 {
    // TODO 1: check both pointers, read the name with `CStr`, and push
    //         `badge_text(name)` without letting its panic leave this function
    todo!("visitor_log_add")
}

/// Returns the badge of the latest visitor as a new C string, or null if
/// `log` is null or has no visitor. The caller owns the string and must pass
/// it to `visitor_badge_free`.
///
/// # Safety
///
/// `log` must be null or a live pointer from `visitor_log_new`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn visitor_log_last(log: *const VisitorLog) -> *mut c_char {
    // TODO 2: build a `CString` from the last badge and give it to the caller
    todo!("visitor_log_last")
}

/// Frees a badge.
///
/// # Safety
///
/// `badge` must be null or a pointer from `visitor_log_last` that has not
/// been freed, and it must not be used afterwards.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn visitor_badge_free(badge: *mut c_char) {
    // TODO 3: take the string back from C and drop it. Null is allowed.
    todo!("visitor_badge_free")
}

/// Frees a log.
///
/// # Safety
///
/// `log` must be null or a pointer from `visitor_log_new` that has not been
/// freed, and it must not be used afterwards.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn visitor_log_free(log: *mut VisitorLog) {
    // TODO 4: the mirror image of `visitor_log_new`. Null is allowed.
    todo!("visitor_log_free")
}
