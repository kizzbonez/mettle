// "1.2.3" means 1.2.3 or later, and below 2.0.0.
assert!(allows("1.2.3", Version::new(1, 2, 3)), "a requirement allows the very version it names");
assert!(allows("1.2.3", Version::new(1, 2, 4)), "a later patch is allowed");
assert!(allows("1.2.3", Version::new(1, 3, 0)), "a later minor version is allowed, even with a smaller patch number");
assert!(allows("1.2.3", Version::new(1, 99, 99)), "everything up to the next major version is allowed");
assert!(!allows("1.2.3", Version::new(1, 2, 2)), "an earlier patch is not allowed");
assert!(
    !allows("1.2.3", Version::new(1, 1, 9)),
    "an earlier minor version is not allowed, even with a larger patch number"
);
assert!(!allows("1.2.3", Version::new(0, 9, 9)), "an earlier major version is not allowed");
assert!(!allows("1.2.3", Version::new(2, 0, 0)), "the upper bound itself is not allowed");
assert!(!allows("1.2.3", Version::new(3, 2, 3)), "a later major version is not allowed");

// "0.2.3" means 0.2.3 or later, and below 0.3.0.
assert!(allows("0.2.3", Version::new(0, 2, 3)), "before 1.0 a requirement allows the version it names");
assert!(allows("0.2.3", Version::new(0, 2, 9)), "before 1.0 a later patch is allowed");
assert!(!allows("0.2.3", Version::new(0, 2, 2)), "before 1.0 an earlier patch is not allowed");
assert!(!allows("0.2.3", Version::new(0, 3, 0)), "before 1.0 the next minor version counts as breaking");
assert!(!allows("0.2.3", Version::new(1, 0, 0)), "before 1.0 the first major version is not allowed");

// "0.0.3" means 0.0.3 and nothing else.
assert!(allows("0.0.3", Version::new(0, 0, 3)), "with 0.0 in front the named version is allowed");
assert!(!allows("0.0.3", Version::new(0, 0, 4)), "with 0.0 in front the next patch is not allowed");
assert!(!allows("0.0.3", Version::new(0, 0, 2)), "with 0.0 in front an earlier patch is not allowed");
assert!(!allows("0.0.3", Version::new(0, 1, 0)), "with 0.0 in front the next minor version is not allowed");

// "=1.2.3" means exactly 1.2.3.
assert!(allows("=1.2.3", Version::new(1, 2, 3)), "an exact requirement allows the version it names");
assert!(!allows("=1.2.3", Version::new(1, 2, 4)), "an exact requirement does not allow a later patch");
assert!(!allows("=1.2.3", Version::new(1, 3, 0)), "an exact requirement does not allow a later minor version");
assert!(!allows("=1.2.3", Version::new(1, 2, 2)), "an exact requirement does not allow an earlier patch");
assert!(!allows("=0.2.3", Version::new(0, 2, 9)), "an exact requirement before 1.0 does not allow a later patch");

// Requirements that cannot be read accept nothing.
let any = Version::new(1, 2, 0);
assert!(!allows("", any), "an empty requirement accepts nothing");
assert!(!allows("1.2", any), "a requirement of two numbers is not read by parse_version, so it accepts nothing");
assert!(!allows("1.2.0.0", any), "a requirement of four numbers accepts nothing");
assert!(!allows("one.two.zero", any), "a requirement written in words accepts nothing");
assert!(!allows("=", any), "an equals sign with nothing after it accepts nothing");
assert!(!allows("=1.2", any), "an exact requirement of two numbers accepts nothing");
