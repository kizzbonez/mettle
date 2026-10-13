//! Watering Log
//!
//! Turns a garden's watering log into typed values. Nothing in this file may
//! panic on bad text: every problem is reported through a `Result`.

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
    let Some((plant, amount)) = line.split_once('=') else {
        return Err(LogError::MissingEquals);
    };
    let plant = plant.trim();
    if plant.is_empty() {
        return Err(LogError::EmptyPlant);
    }
    let amount = amount.trim();
    let Ok(milliliters) = amount.parse::<u32>() else {
        return Err(LogError::BadAmount(amount.to_string()));
    };
    if milliliters == 0 {
        return Err(LogError::BadAmount(amount.to_string()));
    }
    Ok(Watering { plant: plant.to_string(), milliliters })
}

/// Parses a whole log, skipping blank lines.
pub fn parse_log(text: &str) -> Result<Vec<Watering>, (usize, LogError)> {
    let mut waterings = Vec::new();
    for (index, line) in text.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        match parse_watering(line) {
            Ok(watering) => waterings.push(watering),
            Err(error) => return Err((index + 1, error)),
        }
    }
    Ok(waterings)
}

/// The milliliters that one plant received in total.
pub fn total_for(waterings: &[Watering], plant: &str) -> u32 {
    let mut total = 0;
    for watering in waterings {
        if watering.plant == plant {
            total += watering.milliliters;
        }
    }
    total
}
