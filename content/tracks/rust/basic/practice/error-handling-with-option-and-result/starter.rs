//! Race Registration
//!
//! Checks what a volunteer types at a marathon's registration desk. Nothing
//! here may panic: a failure is a `Result` or an `Option` for the caller.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// Why an age was rejected.
#[derive(Debug, PartialEq)]
pub enum AgeError {
    /// Nothing was typed.
    Missing,
    /// The text is not a whole number from 0 to 255. Carries the trimmed text.
    NotANumber(String),
    /// The runner is under 18. Carries the age.
    TooYoung(u8),
}

/// Reads a runner's age from what was typed.
pub fn parse_age(text: &str) -> Result<u8, AgeError> {
    // TODO 1: trim, then check in this order: missing, not a number, too young
    todo!("parse_age")
}

/// The entry fee in cents for the age that was typed.
pub fn entry_fee(age_text: &str) -> Result<u32, AgeError> {
    // TODO 2: call `parse_age` and pass its error on with `?`
    todo!("entry_fee")
}

/// Turns a time such as `3:45` into minutes, or `None` if it is not a time.
pub fn finish_minutes(time: &str) -> Option<u32> {
    // TODO 3: split at the colon, parse both parts, check the minutes
    todo!("finish_minutes")
}
