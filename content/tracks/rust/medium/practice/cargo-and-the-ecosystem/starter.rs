//! Update Day
//!
//! The rules Cargo applies to a manifest, written as code: which versions a
//! requirement allows, which release an update picks, and which features of
//! a dependency end up switched on.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// A version, `MAJOR.MINOR.PATCH`. The fields are declared in that order,
/// so the derived ordering compares the major number first.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl Version {
    /// Builds a version. Complete: nothing to write here.
    pub fn new(major: u32, minor: u32, patch: u32) -> Version {
        Version { major, minor, patch }
    }
}

/// Reads a version such as `1.2.3`: exactly three numbers with dots between
/// them. Complete: nothing to write here.
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
    todo!("upper_bound")
}

/// Whether the requirement accepts the version.
pub fn allows(requirement: &str, version: Version) -> bool {
    todo!("allows")
}

/// The newest published version that the requirement allows.
pub fn newest_allowed(requirement: &str, published: &[Version]) -> Option<Version> {
    todo!("newest_allowed")
}

/// The features that end up switched on, each once, in alphabetical order.
pub fn enabled_features<'a>(
    defaults: &[&'a str],
    requested: &[&'a str],
    default_features: bool,
) -> Vec<&'a str> {
    todo!("enabled_features")
}
