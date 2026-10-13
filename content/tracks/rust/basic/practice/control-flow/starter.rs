//! Pool Day
//!
//! Four calculations for the front desk of a swimming pool. Each one needs a
//! decision, a loop, or both.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// The price of a ticket in cents, which depends on the visitor's age.
pub fn entry_price(age: u32) -> u32 {
    todo!("entry_price")
}

/// The number of lanes with more than 4 swimmers.
pub fn busy_lanes(swimmers: [u32; 6]) -> u32 {
    todo!("busy_lanes")
}

/// The sum of the whole numbers from 1 to `top`, with `top` included.
pub fn pyramid_lengths(top: u32) -> u32 {
    todo!("pyramid_lengths")
}

/// The whole hours until the water, which rises 15 cm an hour, is at least
/// `target` cm deep.
pub fn hours_to_fill(depth: u32, target: u32) -> u32 {
    todo!("hours_to_fill")
}
