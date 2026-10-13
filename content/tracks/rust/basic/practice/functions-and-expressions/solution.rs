//! Recipe Card
//!
//! Small calculations for a recipe: times, scaled amounts and baking trays.

/// How many cookies fit on one baking tray.
const COOKIES_PER_TRAY: u32 = 12;

/// Turns hours and minutes into minutes.
pub fn total_minutes(hours: u32, minutes: u32) -> u32 {
    hours * 60 + minutes
}

/// Scales an amount in grams from one number of servings to another.
pub fn scaled_grams(grams: u32, from_servings: u32, to_servings: u32) -> u32 {
    // Multiplying first keeps the fraction until the very last step.
    grams * to_servings / from_servings
}

/// Whether the cookies need more than one tray.
pub fn needs_second_tray(cookies: u32) -> bool {
    cookies > COOKIES_PER_TRAY
}

/// The minutes until the food is ready: preparation plus baking.
pub fn ready_in(prep_hours: u32, prep_minutes: u32, baking_minutes: u32) -> u32 {
    total_minutes(prep_hours, prep_minutes) + baking_minutes
}
