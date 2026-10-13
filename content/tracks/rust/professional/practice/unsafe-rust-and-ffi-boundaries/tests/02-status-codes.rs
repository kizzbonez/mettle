use std::ffi::{CStr, c_char};

/// Reads and frees the last badge of a log, as the kiosk does.
unsafe fn last_badge(log: *const VisitorLog) -> Option<String> {
    // SAFETY: the caller passes a live log. The badge is copied, then freed
    // once with the function that matches `visitor_log_last`.
    unsafe {
        let badge = visitor_log_last(log);
        if badge.is_null() {
            return None;
        }
        let text = CStr::from_ptr(badge).to_string_lossy().into_owned();
        visitor_badge_free(badge);
        Some(text)
    }
}

let not_utf8 = CStr::from_bytes_with_nul(b"caf\xe9\0").expect("bytes that end in one NUL");
let log = visitor_log_new();

// SAFETY: `log` is live until the last line, and every name is NUL-terminated.
unsafe {
    assert!(last_badge(log).is_none(), "the last badge of a new log is a null pointer");

    // Null pointers, on either side.
    assert!(
        visitor_log_add(std::ptr::null_mut(), c"ada".as_ptr()) == -1,
        "a null log gives the status for a null pointer"
    );
    assert!(
        visitor_log_add(log, std::ptr::null::<c_char>()) == -1,
        "a null name gives the status for a null pointer"
    );
    assert!(
        visitor_log_add(std::ptr::null_mut(), not_utf8.as_ptr()) == -1,
        "a null log is reported before the name is looked at"
    );
    assert!(last_badge(log).is_none(), "a call that reported a null pointer added nothing");

    // A valid name is trimmed and upper-cased by badge_text.
    assert!(visitor_log_add(log, c"grace hopper".as_ptr()) == 0, "a valid name gives status 0");
    assert!(
        last_badge(log).as_deref() == Some("GRACE HOPPER"),
        "the last badge is what badge_text made of the latest name"
    );

    // Bytes that are not UTF-8.
    assert!(
        visitor_log_add(log, not_utf8.as_ptr()) == -2,
        "a name that is not UTF-8 gives its own status"
    );
    assert!(
        last_badge(log).as_deref() == Some("GRACE HOPPER"),
        "a name that is not UTF-8 is not added to the log"
    );

    // A panic in badge_text must come back as a status, not end the process.
    assert!(
        visitor_log_add(log, c"".as_ptr()) == -3,
        "an empty name makes badge_text panic, and the panic is reported as a status"
    );
    assert!(
        visitor_log_add(log, c" \t ".as_ptr()) == -3,
        "a name of whitespace only makes badge_text panic, and the panic is reported as a status"
    );
    assert!(
        last_badge(log).as_deref() == Some("GRACE HOPPER"),
        "a name that made badge_text panic is not added to the log"
    );

    // The log still works after every kind of failure.
    assert!(
        visitor_log_add(log, c"zo\u{eb}".as_ptr()) == 0,
        "a valid name is accepted after earlier calls failed"
    );
    assert!(
        last_badge(log).as_deref() == Some("ZO\u{cb}"),
        "a name with a letter outside ASCII is read as UTF-8"
    );

    visitor_log_free(log);
}
