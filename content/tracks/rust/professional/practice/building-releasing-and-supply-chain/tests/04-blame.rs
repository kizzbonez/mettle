// The [features] table of `hasher`.
let table = [
    Feature { name: "fast", enables: &[] },
    Feature { name: "secure", enables: &["std"] },
    Feature { name: "std", enables: &[] },
    Feature { name: "full", enables: &["fast", "secure"] },
    Feature { name: "default", enables: &["full"] },
];

let requests = [
    Request { dependent: "zeta", dependency: "hasher", features: &["std"] },
    Request { dependent: "report", dependency: "hasher", features: &["secure"] },
    Request { dependent: "api", dependency: "hasher", features: &["fast"] },
    Request { dependent: "cli", dependency: "hasher", features: &["full"] },
    Request { dependent: "cli", dependency: "hasher", features: &["fast"] },
    Request { dependent: "web", dependency: "hasher", features: &[] },
    Request { dependent: "alpha", dependency: "hasher", features: &["default"] },
    Request { dependent: "api", dependency: "codec", features: &["fast"] },
    Request { dependent: "mail", dependency: "codec", features: &["secure", "json"] },
];

assert!(
    blame(&table, &requests, "hasher", "fast") == vec!["alpha", "api", "cli"],
    "the dependents that ask for a feature by name or through another feature, sorted, each once"
);
assert!(
    blame(&table, &requests, "hasher", "secure") == vec!["alpha", "cli", "report"],
    "a dependent that asks for a feature which enables the wanted one is named too"
);
assert!(
    blame(&table, &requests, "hasher", "std") == vec!["alpha", "cli", "report", "zeta"],
    "a feature that is reached after several steps is traced back to every dependent that started one"
);
assert!(
    blame(&table, &requests, "hasher", "full") == vec!["alpha", "cli"],
    "a feature in the middle of a chain is traced back as well"
);
assert!(
    blame(&table, &requests, "hasher", "default") == vec!["alpha"],
    "a feature that only one dependent asks for names that dependent"
);

// Nobody.
assert!(
    blame(&table, &requests, "hasher", "nightly").is_empty(),
    "a feature that nobody switches on has nobody to name"
);
assert!(
    blame(&table, &requests, "logger", "fast").is_empty(),
    "a dependency that nobody requests has nobody to name"
);
assert!(blame(&table, &[], "hasher", "fast").is_empty(), "without requests there is nobody to name");

// Only requests for the named dependency count.
assert!(
    blame(&table, &requests, "codec", "fast") == vec!["api"],
    "a request for another dependency does not count, even when it names the same feature"
);
assert!(
    blame(&table, &requests, "codec", "json") == vec!["mail"],
    "a feature without a row in the table is found when a dependent names it"
);

// Without the table, only what was asked for by name can be seen.
assert!(
    blame(&[], &requests, "hasher", "fast") == vec!["api", "cli"],
    "with an empty table, only the dependents that name the feature themselves are found"
);
assert!(
    blame(&[], &requests, "hasher", "secure") == vec!["report"],
    "with an empty table, a dependent that asked for a broader feature is not found"
);

// The question from the scenario: which crates must change to switch one of
// two clashing features off?
let fast: Vec<String> = blame(&table, &requests, "hasher", "fast");
let secure: Vec<String> = blame(&table, &requests, "hasher", "secure");
let both: Vec<&String> = fast.iter().filter(|dependent| secure.contains(dependent)).collect();
assert!(
    both == vec!["alpha", "cli"],
    "the dependents that switch both features on are the ones named for each of the two"
);
