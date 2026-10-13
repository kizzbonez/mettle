//! Race Registration
//!
//! Checks what a volunteer types at a marathon's registration desk. Nothing
//! here may panic: a failure is a `Result` or an `Option` for the caller.

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
    let text = text.trim();
    if text.is_empty() {
        return Err(AgeError::Missing);
    }
    let Ok(age) = text.parse::<u8>() else {
        return Err(AgeError::NotANumber(text.to_string()));
    };
    if age < 18 {
        return Err(AgeError::TooYoung(age));
    }
    Ok(age)
}

/// The entry fee in cents for the age that was typed.
pub fn entry_fee(age_text: &str) -> Result<u32, AgeError> {
    let age = parse_age(age_text)?;
    if age >= 60 {
        return Ok(2000);
    }
    Ok(3500)
}

/// Turns a time such as `3:45` into minutes, or `None` if it is not a time.
pub fn finish_minutes(time: &str) -> Option<u32> {
    let (hours, minutes) = time.split_once(':')?;
    let hours = hours.parse::<u32>().ok()?;
    let minutes = minutes.parse::<u32>().ok()?;
    if minutes >= 60 {
        return None;
    }
    Some(hours * 60 + minutes)
}
