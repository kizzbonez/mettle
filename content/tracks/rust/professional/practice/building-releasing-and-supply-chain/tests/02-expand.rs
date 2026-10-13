use std::collections::BTreeSet;

let set = |names: &[&str]| names.iter().map(|name| name.to_string()).collect::<BTreeSet<String>>();

let table = [
    Feature { name: "default", enables: &["std"] },
    Feature { name: "std", enables: &[] },
    Feature { name: "json", enables: &["serde", "std"] },
    Feature { name: "serde", enables: &["alloc"] },
    Feature { name: "alloc", enables: &[] },
    Feature { name: "full", enables: &["json", "metrics"] },
    Feature { name: "metrics", enables: &[] },
    Feature { name: "ping", enables: &["pong"] },
    Feature { name: "pong", enables: &["ping"] },
    Feature { name: "mirror", enables: &["mirror"] },
];

assert!(expand(&table, &[]).is_empty(), "with nothing requested, nothing is on");
assert!(
    expand(&table, &["std"]) == set(&["std"]),
    "a feature that enables nothing is on by itself"
);
assert!(
    expand(&table, &["default"]) == set(&["default", "std"]),
    "a requested feature is on, and so is the feature it enables"
);
assert!(
    expand(&table, &["json"]) == set(&["alloc", "json", "serde", "std"]),
    "what an enabled feature enables is on as well: two steps from the request"
);
assert!(
    expand(&table, &["full"]) == set(&["alloc", "full", "json", "metrics", "serde", "std"]),
    "enabling goes on for as many steps as the table has: three steps from the request"
);
assert!(
    expand(&table, &["json", "default"]) == set(&["alloc", "default", "json", "serde", "std"]),
    "two requests that reach the same feature list it once"
);
assert!(
    expand(&table, &["std", "std"]) == set(&["std"]),
    "a feature requested twice is listed once"
);

// A name without a row in the table.
assert!(
    expand(&table, &["nightly"]) == set(&["nightly"]),
    "a requested name with no row in the table is on and enables nothing"
);
assert!(
    expand(&[], &["b", "a"]) == set(&["a", "b"]),
    "with an empty table, exactly the requested names are on"
);
let dangling = [Feature { name: "tls", enables: &["ring"] }];
assert!(
    expand(&dangling, &["tls"]) == set(&["ring", "tls"]),
    "an enabled name with no row of its own is on and enables nothing"
);

// Cycles must not keep the function busy for ever.
assert!(
    expand(&table, &["ping"]) == set(&["ping", "pong"]),
    "two features that enable each other are both on, and the function finishes"
);
assert!(
    expand(&table, &["mirror"]) == set(&["mirror"]),
    "a feature that enables itself is on, and the function finishes"
);

// The order of the rows does not matter.
let mut reversed = table;
reversed.reverse();
assert!(
    expand(&reversed, &["full"]) == expand(&table, &["full"]),
    "the same table with its rows in another order gives the same result"
);

// A long chain: each feature enables the next one.
let names: Vec<String> = (0..200).map(|number| format!("f{number:03}")).collect();
let next: Vec<[&str; 1]> = (1..200).map(|number| [names[number].as_str()]).collect();
let chain: Vec<Feature<'_>> =
    (0..199).map(|number| Feature { name: &names[number], enables: &next[number] }).collect();
let all = expand(&chain, &["f000"]);
assert!(
    all.len() == 200 && all.contains("f199"),
    "a chain of 200 features is followed to its end"
);
assert!(
    expand(&chain, &["f150"]).len() == 50,
    "a request in the middle of a chain switches on only what follows it"
);
