// The example from the instructions.
assert_eq!(upper_bound(Version::new(1, 2, 3)), Version::new(2, 0, 0), "the upper bound of the requirement 1.2.3");
assert_eq!(upper_bound(Version::new(0, 2, 3)), Version::new(0, 3, 0), "the upper bound of the requirement 0.2.3");
assert_eq!(upper_bound(Version::new(0, 0, 3)), Version::new(0, 0, 4), "the upper bound of the requirement 0.0.3");

assert_eq!(allows("1.2.3", Version::new(1, 9, 0)), true, "whether the requirement 1.2.3 allows version 1.9.0");
assert_eq!(allows("1.2.3", Version::new(2, 0, 0)), false, "whether the requirement 1.2.3 allows version 2.0.0");
assert_eq!(allows("0.2.3", Version::new(0, 3, 0)), false, "whether the requirement 0.2.3 allows version 0.3.0");
assert_eq!(allows("=1.2.3", Version::new(1, 2, 4)), false, "whether the requirement =1.2.3 allows version 1.2.4");

let published = [
    Version::new(1, 2, 3),
    Version::new(1, 4, 0),
    Version::new(2, 0, 1),
    Version::new(1, 3, 9),
];
assert_eq!(
    newest_allowed("1.2.3", &published),
    Some(Version::new(1, 4, 0)),
    "the release an update picks for the requirement 1.2.3 among 1.2.3, 1.4.0, 2.0.1 and 1.3.9"
);

assert_eq!(
    enabled_features(&["std"], &["derive", "std"], true),
    ["derive", "std"],
    "the features with the default std, the requested derive and std, and defaults on"
);
assert_eq!(
    enabled_features(&["std"], &["derive"], false),
    ["derive"],
    "the features with the default std, the requested derive, and defaults off"
);
