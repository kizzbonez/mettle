//! Pool Day
//!
//! Four calculations for the front desk of a swimming pool. Each one needs a
//! decision, a loop, or both.

/// The price of a ticket in cents, which depends on the visitor's age.
pub fn entry_price(age: u32) -> u32 {
    if age < 5 {
        0
    } else if age <= 15 {
        300
    } else if age >= 65 {
        350
    } else {
        600
    }
}

/// The number of lanes with more than 4 swimmers.
pub fn busy_lanes(swimmers: [u32; 6]) -> u32 {
    let mut busy = 0;
    for count in swimmers {
        if count > 4 {
            busy += 1;
        }
    }
    busy
}

/// The sum of the whole numbers from 1 to `top`, with `top` included.
pub fn pyramid_lengths(top: u32) -> u32 {
    let mut total = 0;
    for step in 1..=top {
        total += step;
    }
    total
}

/// The whole hours until the water, which rises 15 cm an hour, is at least
/// `target` cm deep.
pub fn hours_to_fill(depth: u32, target: u32) -> u32 {
    let mut depth = depth;
    let mut hours = 0;
    while depth < target {
        depth += 15;
        hours += 1;
    }
    hours
}
