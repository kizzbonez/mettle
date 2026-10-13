//! Name Badges
//!
//! Text handling for conference badges. Parameters are `&str`, new text is
//! returned as a `String`, and a part of existing text is returned as a slice.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// The line on a badge: the name in upper case, ", ", then the company.
pub fn badge_line(name: &str, company: &str) -> String {
    todo!("badge_line")
}

/// The number of characters in the name that are not spaces.
pub fn letter_count(name: &str) -> usize {
    todo!("letter_count")
}

/// The three letters at the start of a ticket code such as `VIP-0042`.
pub fn ticket_kind(code: &str) -> &str {
    todo!("ticket_kind")
}

/// The number of entries in a comma-separated list that are not empty.
pub fn count_sessions(list: &str) -> usize {
    todo!("count_sessions")
}
