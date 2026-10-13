//! Latency Roll-up: reference solution.

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
    samples: u64,
}

impl Summary for Count {
    fn record(&mut self, _sample: u64) {
        self.samples += 1;
    }

    fn merge(&mut self, other: &Self) {
        self.samples += other.samples;
    }

    fn value(&self) -> Option<u64> {
        // `then_some` keeps the "no samples yet" case out of the numbers.
        (self.samples > 0).then_some(self.samples)
    }
}

/// The largest sample.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct Max {
    largest: Option<u64>,
}

impl Summary for Max {
    fn record(&mut self, sample: u64) {
        // `None < Some(_)` for every value, so `max` also covers the first sample.
        self.largest = self.largest.max(Some(sample));
    }

    fn merge(&mut self, other: &Self) {
        self.largest = self.largest.max(other.largest);
    }

    fn value(&self) -> Option<u64> {
        self.largest
    }
}

/// The arithmetic mean, rounded down.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct Mean {
    // Total and count, not the mean itself: two means cannot be combined
    // without knowing how many samples each one stands for. The total is a
    // u128 because a handful of u64::MAX samples would overflow a u64.
    total: u128,
    samples: u64,
}

impl Summary for Mean {
    fn record(&mut self, sample: u64) {
        self.total += u128::from(sample);
        self.samples += 1;
    }

    fn merge(&mut self, other: &Self) {
        self.total += other.total;
        self.samples += other.samples;
    }

    fn value(&self) -> Option<u64> {
        if self.samples == 0 {
            return None;
        }
        // The mean of u64 values always fits in a u64 again.
        Some((self.total / u128::from(self.samples)) as u64)
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
        self.groups.entry(key).or_default().record(sample);
    }

    /// The number of distinct keys.
    pub fn len(&self) -> usize {
        self.groups.len()
    }

    /// The value for one key, or `None` if the key was never recorded.
    pub fn get(&self, key: &K) -> Option<u64> {
        self.groups.get(key).and_then(Summary::value)
    }

    /// Every key with its value, in ascending key order.
    pub fn report(&self) -> Vec<(K, u64)> {
        // A BTreeMap iterates in key order, so no sorting is needed here.
        self.groups
            .iter()
            .filter_map(|(key, summary)| Some((key.clone(), summary.value()?)))
            .collect()
    }

    /// The `n` keys with the largest values, largest first; ties in key order.
    pub fn top(&self, n: usize) -> Vec<(K, u64)> {
        let mut rows = self.report();
        // `report` is in key order and `sort_by` is stable, so rows with equal
        // values keep that order: the tie-break comes for free.
        rows.sort_by(|a, b| b.1.cmp(&a.1));
        rows.truncate(n);
        rows
    }

    /// Merges another roll-up into this one, key by key.
    pub fn merge(&mut self, other: &Rollup<K, S>) {
        for (key, summary) in &other.groups {
            // A key that only `other` has starts from the empty summary.
            self.groups.entry(key.clone()).or_default().merge(summary);
        }
    }
}

impl<K: Ord + Clone, S: Summary> FromIterator<(K, u64)> for Rollup<K, S> {
    fn from_iter<I: IntoIterator<Item = (K, u64)>>(iter: I) -> Self {
        let mut rollup = Rollup::new();
        for (key, sample) in iter {
            rollup.record(key, sample);
        }
        rollup
    }
}
