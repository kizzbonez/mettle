// The example from the instructions. The test stands in for the C firmware:
// it only ever holds raw pointers.
use std::ffi::CStr;

let log = visitor_log_new();
assert!(!log.is_null(), "visitor_log_new returns a handle");

// SAFETY: `log` is live until `visitor_log_free`, every name is a C string
// literal, and each pointer is freed once by the function that matches it.
unsafe {
    assert_eq!(visitor_log_add(log, c" ada ".as_ptr()), 0, "the status for a valid name");
    assert_eq!(
        visitor_log_add(log, std::ptr::null()),
        -1,
        "the status for a name that is a null pointer"
    );
    assert_eq!(
        visitor_log_add(log, c"  ".as_ptr()),
        -3,
        "the status for a blank name, which makes badge_text panic"
    );

    let badge = visitor_log_last(log);
    assert!(!badge.is_null(), "the last badge of a log with one visitor is a string, not null");
    assert_eq!(
        CStr::from_ptr(badge).to_str(),
        Ok("ADA"),
        "the last badge, read by the caller as a C string"
    );

    visitor_badge_free(badge);
    visitor_log_free(log);
}
