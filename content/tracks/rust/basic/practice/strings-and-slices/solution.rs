//! Name Badges
//!
//! Text handling for conference badges. Parameters are `&str`, new text is
//! returned as a `String`, and a part of existing text is returned as a slice.

/// The line on a badge: the name in upper case, ", ", then the company.
pub fn badge_line(name: &str, company: &str) -> String {
    let name = name.trim().to_uppercase();
    let company = company.trim();
    format!("{name}, {company}")
}

/// The number of characters in the name that are not spaces.
pub fn letter_count(name: &str) -> usize {
    let mut count = 0;
    for letter in name.chars() {
        if letter != ' ' {
            count += 1;
        }
    }
    count
}

/// The three letters at the start of a ticket code such as `VIP-0042`.
pub fn ticket_kind(code: &str) -> &str {
    // Byte positions are safe here because the letters are plain ASCII.
    &code[0..3]
}

/// The number of entries in a comma-separated list that are not empty.
pub fn count_sessions(list: &str) -> usize {
    let mut count = 0;
    for session in list.split(',') {
        if !session.trim().is_empty() {
            count += 1;
        }
    }
    count
}
