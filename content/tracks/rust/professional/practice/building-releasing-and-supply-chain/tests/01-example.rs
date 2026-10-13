// The example from the instructions.
use std::collections::BTreeSet;

let set = |names: &[&str]| names.iter().map(|name| name.to_string()).collect::<BTreeSet<String>>();

// The [features] table of the `hasher` crate.
let table = [
    Feature { name: "fast", enables: &[] },
    Feature { name: "secure", enables: &["std"] },
    Feature { name: "std", enables: &[] },
    Feature { name: "full", enables: &["fast", "secure"] },
];

// Who asks for what, across the workspace.
let requests = [
    Request { dependent: "report", dependency: "hasher", features: &["secure"] },
    Request { dependent: "api", dependency: "hasher", features: &["fast"] },
    Request { dependent: "cli", dependency: "hasher", features: &["full"] },
    Request { dependent: "cli", dependency: "codec", features: &[] },
];

assert_eq!(
    expand(&table, &["full"]),
    set(&["fast", "full", "secure", "std"]),
    "the features that are on when `full` is requested"
);

let unified = unify(&requests);
assert_eq!(
    unified.keys().map(String::as_str).collect::<Vec<&str>>(),
    vec!["codec", "hasher"],
    "the dependencies that Cargo builds"
);
assert_eq!(
    unified.get("hasher"),
    Some(&set(&["fast", "full", "secure"])),
    "the features `hasher` is built with: the union of three requests"
);
assert_eq!(
    unified.get("codec"),
    Some(&set(&[])),
    "the features `codec` is built with, which nobody asked any of"
);

assert_eq!(
    blame(&table, &requests, "hasher", "fast"),
    vec!["api", "cli"],
    "the dependents that switch `fast` on for `hasher`"
);
assert_eq!(
    blame(&table, &requests, "hasher", "std"),
    vec!["cli", "report"],
    "the dependents that switch `std` on for `hasher`"
);
