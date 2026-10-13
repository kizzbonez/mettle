//! Latency Roll-up
//!
//! A trait for statistics and a generic container that keeps one per key.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::collections::BTreeMap;

/// A statistic over a stream of samples. `Default` is the summary of nothing.
pub trait Summary: Default {
    /// Adds one sample.
    fn record(&mut self, sample: u64);
    /// Adds every sample `other` has seen.
    fn merge(&mut self, other: &Self);
    /// The statistic, or `None` if no sample has been recorded.
    fn value(&self) -> Option<u64>;
}

/// The number of samples.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct Count {
    // TODO 1: choose the fields
}

impl Summary for Count {
    fn record(&mut self, sample: u64) {
        todo!("Count::record")
    }

    fn merge(&mut self, other: &Self) {
        todo!("Count::merge")
    }

    fn value(&self) -> Option<u64> {
        todo!("Count::value")
    }
}

/// The largest sample.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct Max {
    // TODO 2: choose the fields
}

impl Summary for Max {
    fn record(&mut self, sample: u64) {
        todo!("Max::record")
    }

    fn merge(&mut self, other: &Self) {
        todo!("Max::merge")
    }

    fn value(&self) -> Option<u64> {
        todo!("Max::value")
    }
}

/// The arithmetic mean, rounded down.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct Mean {
    // TODO 3: choose the fields. What do two means need to remember so that
    //         they can be merged exactly?
}

impl Summary for Mean {
    fn record(&mut self, sample: u64) {
        todo!("Mean::record")
    }

    fn merge(&mut self, other: &Self) {
        todo!("Mean::merge")
    }

    fn value(&self) -> Option<u64> {
        todo!("Mean::value")
    }
}

/// One summary of type `S` per key of type `K`.
pub struct Rollup<K, S> {
    groups: BTreeMap<K, S>,
}

impl<K: Ord + Clone, S: Summary> Rollup<K, S> {
    pub fn new() -> Self {
        Rollup { groups: BTreeMap::new() }
    }

    /// Adds a sample to the summary for `key`.
    pub fn record(&mut self, key: K, sample: u64) {
        // TODO 4: the entry API finds or creates the summary in one lookup
        todo!("Rollup::record")
    }

    /// The number of distinct keys.
    pub fn len(&self) -> usize {
        todo!("Rollup::len")
    }

    /// The value for one key, or `None` if the key was never recorded.
    pub fn get(&self, key: &K) -> Option<u64> {
        todo!("Rollup::get")
    }

    /// Every key with its value, in ascending key order.
    pub fn report(&self) -> Vec<(K, u64)> {
        todo!("Rollup::report")
    }

    /// The `n` keys with the largest values, largest first; ties in key order.
    pub fn top(&self, n: usize) -> Vec<(K, u64)> {
        todo!("Rollup::top")
    }

    /// Merges another roll-up into this one, key by key.
    pub fn merge(&mut self, other: &Rollup<K, S>) {
        todo!("Rollup::merge")
    }
}

impl<K: Ord + Clone, S: Summary> FromIterator<(K, u64)> for Rollup<K, S> {
    fn from_iter<I: IntoIterator<Item = (K, u64)>>(iter: I) -> Self {
        // TODO 5: build a roll-up from (key, sample) pairs
        todo!("Rollup::from_iter")
    }
}
