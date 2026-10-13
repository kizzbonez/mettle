//! Repair Cafe
//!
//! Four small reports for a repair cafe. Each one is short once the right
//! collection does the work: a queue with two ends, a set, a sorted map and
//! a stable sort.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::collections::{BTreeMap, HashSet, VecDeque};

/// The queue from front to back, after every item has arrived.
/// Each arrival is an item and whether it is urgent.
pub fn serving_order<'a>(arrivals: &[(&'a str, bool)]) -> Vec<&'a str> {
    todo!("serving_order")
}

/// Each name once, in the order the names first appear.
pub fn first_visits<'a>(names: &[&'a str]) -> Vec<&'a str> {
    todo!("first_visits")
}

/// The total minutes for each kind of item. Each repair is a kind and the
/// minutes it took.
pub fn minutes_by_kind<'a>(repairs: &[(&'a str, u32)]) -> BTreeMap<&'a str, u32> {
    todo!("minutes_by_kind")
}

/// The repairs sorted by minutes, the largest first. Ties keep their order.
pub fn slowest_first<'a>(repairs: &[(&'a str, u32)]) -> Vec<(&'a str, u32)> {
    todo!("slowest_first")
}
