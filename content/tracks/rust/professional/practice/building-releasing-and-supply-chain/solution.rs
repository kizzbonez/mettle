//! Feature Audit
//!
//! Works out what Cargo's feature unification does to a workspace: which
//! features one request really switches on, which features every dependency
//! ends up being built with, and which crates asked for a given one.

use std::collections::{BTreeMap, BTreeSet};

/// One row of a crate's `[features]` table: a feature and the features that
/// it switches on.
#[derive(Debug, Clone, Copy)]
pub struct Feature<'a> {
    pub name: &'a str,
    pub enables: &'a [&'a str],
}

/// One dependency line of a workspace member: `dependent` asks for
/// `dependency` with these features.
#[derive(Debug, Clone, Copy)]
pub struct Request<'a> {
    pub dependent: &'a str,
    pub dependency: &'a str,
    pub features: &'a [&'a str],
}

/// Every feature that is on once the `requested` ones are switched on.
pub fn expand(table: &[Feature<'_>], requested: &[&str]) -> BTreeSet<String> {
    let mut enabled = BTreeSet::new();
    let mut pending: Vec<&str> = requested.to_vec();
    while let Some(name) = pending.pop() {
        // `insert` returns false for a feature that is already on. Skipping
        // it is what makes a table with a cycle finish.
        if !enabled.insert(name.to_string()) {
            continue;
        }
        if let Some(row) = table.iter().find(|row| row.name == name) {
            pending.extend(row.enables.iter().copied());
        }
    }
    enabled
}

/// What Cargo builds: every dependency once, with the union of the features
/// that all its dependents request.
pub fn unify(requests: &[Request<'_>]) -> BTreeMap<String, BTreeSet<String>> {
    let mut unified: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for request in requests {
        // `entry` creates the set even when the request names no feature.
        let features = unified.entry(request.dependency.to_string()).or_default();
        for &feature in request.features {
            features.insert(feature.to_string());
        }
    }
    unified
}

/// The dependents whose request switches `feature` on for `dependency`,
/// directly or through another feature. Sorted, each named once.
pub fn blame(
    table: &[Feature<'_>],
    requests: &[Request<'_>],
    dependency: &str,
    feature: &str,
) -> Vec<String> {
    let mut dependents = BTreeSet::new();
    for request in requests {
        if request.dependency == dependency && expand(table, request.features).contains(feature) {
            dependents.insert(request.dependent.to_string());
        }
    }
    dependents.into_iter().collect()
}
