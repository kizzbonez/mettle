//! Radio Guide
//!
//! Functions and a struct that hand out pieces of a programme guide. Each one
//! should lend a slice of the text it was given. For now each one is declared
//! with an owned `String`, which is the only reason this file builds.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// The line whose time comes first. On a tie, `a`.
// TODO 1: return a `&str`. The result may be either argument.
pub fn earlier(a: &str, b: &str) -> String {
    todo!("earlier")
}

/// The part of `line` after the first `marker`, or `""` without one.
// TODO 2: return a `&str`. The result borrows from `line` and never from `marker`.
pub fn host(line: &str, marker: &str) -> String {
    todo!("host")
}

/// One line of the guide, such as `07:00 Morning News`.
// TODO 3: hold a `&str` in place of the `String`. The struct and its `impl`
// block then need a lifetime parameter.
pub struct Programme {
    line: String,
}

impl Programme {
    /// Wraps a line of the guide.
    pub fn new(line: &str) -> Programme {
        todo!("Programme::new")
    }

    /// The text before the first space.
    // TODO 3: return a `&str` with the lifetime of the line, not of `&self`.
    pub fn time(&self) -> String {
        todo!("time")
    }

    /// The text after the first space.
    // TODO 3: return a `&str` with the lifetime of the line, not of `&self`.
    pub fn title(&self) -> String {
        todo!("title")
    }
}
