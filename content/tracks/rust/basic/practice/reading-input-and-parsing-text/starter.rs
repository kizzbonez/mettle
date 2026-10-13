//! Watering Log
//!
//! Turns a garden's watering log into typed values. Nothing in this file may
//! panic on bad text: every problem is reported through a `Result`.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// One valid line of the log.
#[derive(Debug, PartialEq)]
pub struct Watering {
    pub plant: String,
    pub milliliters: u32,
}

/// Why a single line was rejected.
#[derive(Debug, PartialEq)]
pub enum LogError {
    /// The line has no `=`.
    MissingEquals,
    /// Nothing but whitespace stands in front of the `=`.
    EmptyPlant,
    /// The amount is not a whole number above zero. Carries the trimmed text.
    BadAmount(String),
}

/// Parses one line of the form `PLANT = MILLILITERS`.
pub fn parse_watering(line: &str) -> Result<Watering, LogError> {
    // TODO 1: split at the first '=', then check the plant, then the amount
    todo!("parse_watering")
}

/// Parses a whole log, skipping blank lines.
pub fn parse_log(text: &str) -> Result<Vec<Watering>, (usize, LogError)> {
    // TODO 2: number the lines from 1, skip the blank ones, and stop at the
    //         first error
    todo!("parse_log")
}

/// The milliliters that one plant received in total.
pub fn total_for(waterings: &[Watering], plant: &str) -> u32 {
    // TODO 3: add up the waterings whose plant matches exactly
    todo!("total_for")
}
