//! Update Day
//!
//! The rules Cargo applies to a manifest, written as code: which versions a
//! requirement allows, which release an update picks, and which features of
//! a dependency end up switched on.

use std::collections::BTreeSet;

/// A version, `MAJOR.MINOR.PATCH`. The fields are declared in that order,
/// so the derived ordering compares the major number first.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl Version {
    /// Builds a version.
    pub fn new(major: u32, minor: u32, patch: u32) -> Version {
        Version { major, minor, patch }
    }
}

/// Reads a version such as `1.2.3`: exactly three numbers with dots between
/// them.
pub fn parse_version(text: &str) -> Option<Version> {
    let mut parts = text.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next()?.parse().ok()?;
    let patch = parts.next()?.parse().ok()?;
    if parts.next().is_some() {
        return None;
    }
    Some(Version::new(major, minor, patch))
}

/// The first version that a requirement written as `version` no longer allows.
pub fn upper_bound(version: Version) -> Version {
    // The leftmost number that is not zero must not change.
    match version {
        Version { major: 0, minor: 0, patch } => Version::new(0, 0, patch + 1),
        Version { major: 0, minor, .. } => Version::new(0, minor + 1, 0),
        Version { major, .. } => Version::new(major + 1, 0, 0),
    }
}

/// Whether the requirement accepts the version.
pub fn allows(requirement: &str, version: Version) -> bool {
    if requirement.starts_with('=') {
        return parse_version(&requirement[1..]) == Some(version);
    }
    match parse_version(requirement) {
        Some(minimum) => version >= minimum && version < upper_bound(minimum),
        None => false,
    }
}

/// The newest published version that the requirement allows.
pub fn newest_allowed(requirement: &str, published: &[Version]) -> Option<Version> {
    published.iter().copied().filter(|version| allows(requirement, *version)).max()
}

/// The features that end up switched on, each once, in alphabetical order.
pub fn enabled_features<'a>(
    defaults: &[&'a str],
    requested: &[&'a str],
    default_features: bool,
) -> Vec<&'a str> {
    // A sorted set drops the repeats and keeps the order.
    let mut enabled = BTreeSet::new();
    if default_features {
        for &feature in defaults {
            enabled.insert(feature);
        }
    }
    for &feature in requested {
        enabled.insert(feature);
    }
    enabled.into_iter().collect()
}
