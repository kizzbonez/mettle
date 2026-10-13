use std::collections::BTreeSet;

let set = |names: &[&str]| names.iter().map(|name| name.to_string()).collect::<BTreeSet<String>>();

assert!(unify(&[]).is_empty(), "a workspace with no dependency lines builds no dependency");

let requests = [
    Request { dependent: "api", dependency: "codec", features: &["json"] },
    Request { dependent: "cli", dependency: "codec", features: &["metrics"] },
    Request { dependent: "cli", dependency: "logger", features: &[] },
    Request { dependent: "report", dependency: "codec", features: &["json", "std"] },
    Request { dependent: "report", dependency: "hasher", features: &["full"] },
];
let unified = unify(&requests);

assert!(
    unified.keys().map(String::as_str).collect::<Vec<&str>>() == vec!["codec", "hasher", "logger"],
    "every dependency that is named in a request is built, and each is built once"
);
assert!(
    unified.get("codec") == Some(&set(&["json", "metrics", "std"])),
    "a dependency is built with the union of the features of all its dependents"
);
assert!(
    unified.get("logger") == Some(&set(&[])),
    "a dependency that is requested without features is still built, with no feature on"
);
assert!(
    unified.get("hasher") == Some(&set(&["full"])),
    "unify lists the features as they were requested and does not expand them"
);
assert!(unified.get("api").is_none(), "a dependent is not a dependency");

// The order of the requests does not matter.
let mut reversed = requests;
reversed.reverse();
assert!(unify(&reversed) == unified, "the same requests in another order give the same result");

// A request without features neither hides nor clears what others asked for.
let mixed = [
    Request { dependent: "a", dependency: "codec", features: &[] },
    Request { dependent: "b", dependency: "codec", features: &["json"] },
    Request { dependent: "c", dependency: "codec", features: &[] },
];
assert!(
    unify(&mixed).get("codec") == Some(&set(&["json"])),
    "a request without features, before or after one with features, takes nothing away"
);

// The same dependent may name a dependency twice.
let twice = [
    Request { dependent: "api", dependency: "codec", features: &["json"] },
    Request { dependent: "api", dependency: "codec", features: &["json", "xml"] },
];
let unified = unify(&twice);
assert!(
    unified.len() == 1 && unified.get("codec") == Some(&set(&["json", "xml"])),
    "two requests of one dependent are united like the requests of two dependents"
);

// The lesson's warning: two features that exclude each other, asked for by
// two crates that never heard of each other.
let clash = [
    Request { dependent: "billing", dependency: "hasher", features: &["secure-hash"] },
    Request { dependent: "search", dependency: "hasher", features: &["fast-hash"] },
];
assert!(
    unify(&clash).get("hasher") == Some(&set(&["fast-hash", "secure-hash"])),
    "features that two different dependents ask for are both on in the one build of the dependency"
);
