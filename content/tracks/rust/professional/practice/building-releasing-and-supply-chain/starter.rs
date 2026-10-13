//! Feature Audit
//!
//! Works out what Cargo's feature unification does to a workspace: which
//! features one request really switches on, which features every dependency
//! ends up being built with, and which crates asked for a given one.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

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
    // TODO 1: follow `enables` from feature to feature until nothing new
    //         turns up. A table may contain a cycle.
    todo!("expand")
}

/// What Cargo builds: every dependency once, with the union of the features
/// that all its dependents request.
pub fn unify(requests: &[Request<'_>]) -> BTreeMap<String, BTreeSet<String>> {
    // TODO 2: one set for each dependency, also when no feature is asked for
    todo!("unify")
}

/// The dependents whose request switches `feature` on for `dependency`,
/// directly or through another feature. Sorted, each named once.
pub fn blame(
    table: &[Feature<'_>],
    requests: &[Request<'_>],
    dependency: &str,
    feature: &str,
) -> Vec<String> {
    // TODO 3: `expand` each request for this dependency and look for the feature
    todo!("blame")
}
