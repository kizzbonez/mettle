//! Luggage Tags
//!
//! Tags for suitcases at an airport check-in desk. Every tag is a `String`
//! with exactly one owner, and the functions move tags in and out.

/// Creates the tag for a destination. The caller owns the result.
pub fn new_tag(destination: &str) -> String {
    let mut tag = String::from("To: ");
    tag.push_str(destination);
    tag
}

/// Takes ownership of a tag, marks it as fragile and gives it back.
pub fn mark_fragile(mut tag: String) -> String {
    tag.push_str(" [fragile]");
    tag
}

/// Returns the tag it was given together with an independent copy.
pub fn copy_tag(tag: String) -> (String, String) {
    let copy = tag.clone();
    (tag, copy)
}

/// Creates a tag and marks it as fragile when asked to.
pub fn prepare(destination: &str, fragile: bool) -> String {
    let tag = new_tag(destination);
    if fragile {
        // `tag` moves into `mark_fragile`, and the marked tag moves out to
        // the caller.
        return mark_fragile(tag);
    }
    tag
}
