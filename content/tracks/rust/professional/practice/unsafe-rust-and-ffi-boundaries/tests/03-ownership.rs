use std::ffi::{CStr, c_char};

let log = visitor_log_new();

// SAFETY: `log` is live until `visitor_log_free`. Every badge is read only
// before its own `visitor_badge_free`, and each pointer is freed once.
unsafe {
    assert!(
        visitor_log_last(log).is_null(),
        "the last badge of a log without visitors is a null pointer"
    );
    assert!(
        visitor_log_last(std::ptr::null()).is_null(),
        "the last badge of a null log is a null pointer"
    );

    // The name is only lent for the call: the log must keep a copy of its own.
    let mut buffer = *b"mira\0";
    assert!(
        visitor_log_add(log, buffer.as_ptr().cast::<c_char>()) == 0,
        "a name in a buffer of the caller is accepted"
    );
    buffer.copy_from_slice(b"XXXX\0");
    let first = visitor_log_last(log);
    assert!(!first.is_null(), "a log with a visitor has a last badge");
    assert!(
        CStr::from_ptr(first).to_str() == Ok("MIRA"),
        "the log does not depend on the caller's buffer after visitor_log_add has returned"
    );

    // More visitors, so that the log's own storage grows and moves.
    for _ in 0..200 {
        assert!(visitor_log_add(log, c"lin".as_ptr()) == 0, "many visitors can be added");
    }
    let second = visitor_log_last(log);
    let third = visitor_log_last(log);
    assert!(
        second != third && first != second,
        "every call of visitor_log_last returns a string of its own"
    );

    // The badges belong to the caller, so they outlive the log.
    visitor_log_free(log);
    assert!(
        CStr::from_ptr(first).to_str() == Ok("MIRA"),
        "a badge stays valid after more visitors were added and after the log was freed"
    );
    assert!(
        CStr::from_ptr(second).to_str() == Ok("LIN") && CStr::from_ptr(third).to_str() == Ok("LIN"),
        "two badges of the same visitor are two separate strings with the same text"
    );
    visitor_badge_free(first);
    visitor_badge_free(third);
    visitor_badge_free(second);

    // A null pointer is allowed in both free functions and does nothing.
    visitor_badge_free(std::ptr::null_mut());
    visitor_log_free(std::ptr::null_mut());
}
