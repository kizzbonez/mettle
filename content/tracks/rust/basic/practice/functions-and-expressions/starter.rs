//! Recipe Card
//!
//! Small calculations for a recipe: times, scaled amounts and baking trays.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// How many cookies fit on one baking tray.
const COOKIES_PER_TRAY: u32 = 12;

/// Turns hours and minutes into minutes.
pub fn total_minutes(hours: u32, minutes: u32) -> u32 {
    todo!("total_minutes")
}

/// Scales an amount in grams from one number of servings to another.
pub fn scaled_grams(grams: u32, from_servings: u32, to_servings: u32) -> u32 {
    // Multiply first, then divide.
    todo!("scaled_grams")
}

/// Whether the cookies need more than one tray.
pub fn needs_second_tray(cookies: u32) -> bool {
    todo!("needs_second_tray")
}

/// The minutes until the food is ready: preparation plus baking.
pub fn ready_in(prep_hours: u32, prep_minutes: u32, baking_minutes: u32) -> u32 {
    // Call `total_minutes` for the preparation time.
    todo!("ready_in")
}
