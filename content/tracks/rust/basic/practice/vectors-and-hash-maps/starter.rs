//! Waiting Room
//!
//! Waiting times in a `Vec` and visits per species in a `HashMap`, for the
//! front desk of a pet clinic.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::collections::HashMap;

/// Adds `extra` minutes to every waiting time and gives the vector back.
pub fn add_minutes(waits: Vec<u32>, extra: u32) -> Vec<u32> {
    // `waits` is not mutable yet. You may add `mut` in front of its name.
    todo!("add_minutes")
}

/// A new vector with the waiting times that are longer than `limit`.
pub fn long_waits(waits: &[u32], limit: u32) -> Vec<u32> {
    todo!("long_waits")
}

/// How often each species occurs in the list.
pub fn count_by_species(animals: &[&str]) -> HashMap<String, u32> {
    todo!("count_by_species")
}

/// The count for one species, or 0 when it is not in the map.
pub fn visits(counts: &HashMap<String, u32>, species: &str) -> u32 {
    todo!("visits")
}
