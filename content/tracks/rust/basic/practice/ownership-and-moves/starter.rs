//! Luggage Tags
//!
//! Tags for suitcases at an airport check-in desk. Every tag is a `String`
//! with exactly one owner, and the functions move tags in and out.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// Creates the tag for a destination. The caller owns the result.
pub fn new_tag(destination: &str) -> String {
    todo!("new_tag")
}

/// Takes ownership of a tag, marks it as fragile and gives it back.
pub fn mark_fragile(tag: String) -> String {
    // `tag` is not mutable yet. You may add `mut` in front of its name.
    todo!("mark_fragile")
}

/// Returns the tag it was given together with an independent copy.
pub fn copy_tag(tag: String) -> (String, String) {
    todo!("copy_tag")
}

/// Creates a tag and marks it as fragile when asked to.
pub fn prepare(destination: &str, fragile: bool) -> String {
    // Use `new_tag` and `mark_fragile`.
    todo!("prepare")
}
