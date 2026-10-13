//! Radio Guide
//!
//! Functions and a struct that hand out pieces of a programme guide. Each one
//! lends a slice of the text it was given, and the lifetimes in its signature
//! say which text that is.

/// The line whose time comes first. On a tie, `a`.
///
/// The result may be either argument, so one lifetime covers both.
pub fn earlier<'a>(a: &'a str, b: &'a str) -> &'a str {
    // Times are written as `HH:MM`, so comparing them as text is enough.
    if a[..5] <= b[..5] { a } else { b }
}

/// The part of `line` after the first `marker`, or `""` without one.
///
/// Only `line` is annotated: the result never borrows from `marker`.
pub fn host<'a>(line: &'a str, marker: &str) -> &'a str {
    match line.split_once(marker) {
        Some((_, rest)) => rest,
        None => "",
    }
}

/// One line of the guide, such as `07:00 Morning News`.
pub struct Programme<'a> {
    line: &'a str,
}

impl<'a> Programme<'a> {
    /// Wraps a line of the guide.
    pub fn new(line: &'a str) -> Programme<'a> {
        Programme { line }
    }

    /// The text before the first space.
    ///
    /// `&'a str` and not `&str`: the slice borrows from the line, so it may
    /// outlive this `Programme`.
    pub fn time(&self) -> &'a str {
        match self.line.split_once(' ') {
            Some((time, _)) => time,
            None => self.line,
        }
    }

    /// The text after the first space.
    pub fn title(&self) -> &'a str {
        match self.line.split_once(' ') {
            Some((_, title)) => title,
            None => "",
        }
    }
}
