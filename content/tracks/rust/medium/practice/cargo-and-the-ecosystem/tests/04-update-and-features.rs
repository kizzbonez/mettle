// newest_allowed
let published = [
    Version::new(0, 9, 0),
    Version::new(1, 10, 0),
    Version::new(1, 9, 5),
    Version::new(2, 1, 0),
    Version::new(1, 2, 0),
    Version::new(0, 9, 4),
    Version::new(2, 0, 0),
];
assert!(
    newest_allowed("1.2.0", &published) == Some(Version::new(1, 10, 0)),
    "the newest allowed version is found wherever it stands, and minor 10 is newer than minor 9"
);
assert!(
    newest_allowed("2.0.0", &published) == Some(Version::new(2, 1, 0)),
    "a requirement on the newest major version picks the newest release of it"
);
assert!(
    newest_allowed("0.9.0", &published) == Some(Version::new(0, 9, 4)),
    "before 1.0 an update stays inside the minor version"
);
assert!(
    newest_allowed("=1.9.5", &published) == Some(Version::new(1, 9, 5)),
    "an exact requirement picks that one release, though newer ones exist"
);
assert!(
    newest_allowed("1.10.1", &published) == None,
    "a requirement newer than every release of its major version allows none"
);
assert!(newest_allowed("3.0.0", &published) == None, "a requirement on a major version without releases allows none");
assert!(newest_allowed("=1.9.6", &published) == None, "an exact requirement on a release that does not exist allows none");
assert!(newest_allowed("1.2.0", &[]) == None, "with nothing published there is nothing to pick");
assert!(newest_allowed("latest", &published) == None, "a requirement that cannot be read allows none");
assert!(
    newest_allowed("1.2.0", &[Version::new(1, 2, 0)]) == Some(Version::new(1, 2, 0)),
    "the only release is picked when the requirement names it"
);

// enabled_features
assert!(enabled_features(&[], &[], true).is_empty(), "no defaults and no requests switch nothing on");
assert!(
    enabled_features(&["std", "alloc"], &[], true) == ["alloc", "std"],
    "with no requests the defaults are on, in alphabetical order"
);
assert!(
    enabled_features(&["std", "alloc"], &[], false).is_empty(),
    "with the defaults turned off and no requests, nothing is on"
);
assert!(
    enabled_features(&["std"], &["serde", "derive", "rc"], true) == ["derive", "rc", "serde", "std"],
    "requested and default features are listed together in alphabetical order"
);
assert!(
    enabled_features(&["std"], &["serde", "derive", "rc"], false) == ["derive", "rc", "serde"],
    "with the defaults turned off only the requested features are on"
);
assert!(
    enabled_features(&["std", "derive"], &["derive", "std", "derive"], true) == ["derive", "std"],
    "a feature that is named several times is listed once"
);
assert!(
    enabled_features(&["std"], &["std"], false) == ["std"],
    "a default feature that was requested by name stays on when the defaults are turned off"
);
