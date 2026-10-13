// The major number is the leftmost that is not zero.
assert!(upper_bound(Version::new(1, 0, 0)) == Version::new(2, 0, 0), "1.0.0 is bounded by the next major version");
assert!(
    upper_bound(Version::new(3, 7, 9)) == Version::new(4, 0, 0),
    "with a major number above zero, the minor and patch numbers of the bound are zero"
);
assert!(
    upper_bound(Version::new(1, 0, 5)) == Version::new(2, 0, 0),
    "a minor number of zero does not matter when the major number is not zero"
);
assert!(
    upper_bound(Version::new(12, 34, 56)) == Version::new(13, 0, 0),
    "numbers of two digits are raised like any other"
);

// Before 1.0 the minor number is the leftmost that is not zero.
assert!(upper_bound(Version::new(0, 1, 0)) == Version::new(0, 2, 0), "0.1.0 is bounded by the next minor version");
assert!(
    upper_bound(Version::new(0, 9, 9)) == Version::new(0, 10, 0),
    "the minor number after 9 is 10, and the patch number of the bound is zero"
);
assert!(
    upper_bound(Version::new(0, 3, 0)) == Version::new(0, 4, 0),
    "a patch number of zero does not matter when the minor number is not zero"
);

// With 0.0 in front, the patch number is the one that must not change.
assert!(upper_bound(Version::new(0, 0, 1)) == Version::new(0, 0, 2), "0.0.1 is bounded by the next patch version");
assert!(upper_bound(Version::new(0, 0, 9)) == Version::new(0, 0, 10), "the patch number after 9 is 10");
assert!(
    upper_bound(Version::new(0, 0, 0)) == Version::new(0, 0, 1),
    "when all three numbers are zero, the patch counts as the leftmost"
);
