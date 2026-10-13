//! Repair Cafe
//!
//! Four small reports for a repair cafe. Each one is short once the right
//! collection does the work: a queue with two ends, a set, a sorted map and
//! a stable sort.

use std::collections::{BTreeMap, HashSet, VecDeque};

/// The queue from front to back, after every item has arrived.
/// Each arrival is an item and whether it is urgent.
pub fn serving_order<'a>(arrivals: &[(&'a str, bool)]) -> Vec<&'a str> {
    // A `VecDeque` adds cheaply at both ends.
    let mut queue = VecDeque::new();
    for (item, urgent) in arrivals.iter().copied() {
        if urgent {
            queue.push_front(item);
        } else {
            queue.push_back(item);
        }
    }
    queue.into_iter().collect()
}

/// Each name once, in the order the names first appear.
pub fn first_visits<'a>(names: &[&'a str]) -> Vec<&'a str> {
    let mut seen = HashSet::new();
    let mut firsts = Vec::new();
    for name in names.iter().copied() {
        // `insert` returns false when the name was already in the set.
        if seen.insert(name) {
            firsts.push(name);
        }
    }
    firsts
}

/// The total minutes for each kind of item. Each repair is a kind and the
/// minutes it took.
pub fn minutes_by_kind<'a>(repairs: &[(&'a str, u32)]) -> BTreeMap<&'a str, u32> {
    let mut totals = BTreeMap::new();
    for (kind, minutes) in repairs.iter().copied() {
        *totals.entry(kind).or_insert(0) += minutes;
    }
    totals
}

/// The repairs sorted by minutes, the largest first. Ties keep their order.
pub fn slowest_first<'a>(repairs: &[(&'a str, u32)]) -> Vec<(&'a str, u32)> {
    let mut sorted: Vec<(&str, u32)> = repairs.iter().copied().collect();
    // `sort_by` is stable, and swapping the two sides reverses the order.
    sorted.sort_by(|a, b| b.1.cmp(&a.1));
    sorted
}
