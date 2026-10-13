//! Waiting Room
//!
//! Waiting times in a `Vec` and visits per species in a `HashMap`, for the
//! front desk of a pet clinic.

use std::collections::HashMap;

/// Adds `extra` minutes to every waiting time and gives the vector back.
pub fn add_minutes(mut waits: Vec<u32>, extra: u32) -> Vec<u32> {
    for wait in &mut waits {
        *wait += extra;
    }
    waits
}

/// A new vector with the waiting times that are longer than `limit`.
pub fn long_waits(waits: &[u32], limit: u32) -> Vec<u32> {
    let mut long = Vec::new();
    for wait in waits {
        if *wait > limit {
            long.push(*wait);
        }
    }
    long
}

/// How often each species occurs in the list.
pub fn count_by_species(animals: &[&str]) -> HashMap<String, u32> {
    let mut counts = HashMap::new();
    for animal in animals {
        let count = counts.entry(animal.to_string()).or_insert(0);
        *count += 1;
    }
    counts
}

/// The count for one species, or 0 when it is not in the map.
pub fn visits(counts: &HashMap<String, u32>, species: &str) -> u32 {
    counts.get(species).copied().unwrap_or(0)
}
