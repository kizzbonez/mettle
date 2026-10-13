//! Front Desk Kiosk
//!
//! A visitor log written in Rust for a kiosk whose firmware is C. The kiosk
//! holds the log as an opaque handle, passes names as C strings and gets
//! badges back as C strings that it must hand back to be freed.

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
    // SAFETY: per the contract, a non-null `log` points to a live log that
    // only this call is using.
    let Some(log) = (unsafe { log.as_mut() }) else {
        return -1;
    };
    if name.is_null() {
        return -1;
    }
    // SAFETY: `name` is not null, so the contract says it is NUL-terminated
    // and valid until we return. The `&CStr` is not kept after that.
    let Ok(name) = unsafe { CStr::from_ptr(name) }.to_str() else {
        return -2;
    };
    // A panic must not reach the `extern "C"` edge. The log is changed only
    // after `badge_text` has returned, so a panic leaves it as it was.
    match catch_unwind(|| badge_text(name)) {
        Ok(badge) => {
            log.badges.push(badge);
            0
        }
        Err(_) => -3,
    }
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
    // SAFETY: per the contract, a non-null `log` points to a live log.
    let Some(log) = (unsafe { log.as_ref() }) else {
        return ptr::null_mut();
    };
    let Some(badge) = log.badges.last() else {
        return ptr::null_mut();
    };
    // `into_raw` gives the buffer to C. A badge came from a C string, so it
    // holds no NUL byte, but an error still becomes null and not a panic.
    CString::new(badge.as_str()).map_or(ptr::null_mut(), CString::into_raw)
}

/// Frees a badge.
///
/// # Safety
///
/// `badge` must be null or a pointer from `visitor_log_last` that has not
/// been freed, and it must not be used afterwards.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn visitor_badge_free(badge: *mut c_char) {
    if !badge.is_null() {
        // SAFETY: the pointer came from `CString::into_raw` and is reclaimed
        // exactly once, by the allocator that made it.
        drop(unsafe { CString::from_raw(badge) });
    }
}

/// Frees a log.
///
/// # Safety
///
/// `log` must be null or a pointer from `visitor_log_new` that has not been
/// freed, and it must not be used afterwards.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn visitor_log_free(log: *mut VisitorLog) {
    if !log.is_null() {
        // SAFETY: the pointer came from `Box::into_raw` in `visitor_log_new`
        // and is freed exactly once.
        drop(unsafe { Box::from_raw(log) });
    }
}
