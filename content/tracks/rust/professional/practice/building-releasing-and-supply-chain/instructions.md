The two structs in the starter describe a workspace as data. A `Feature` is one row of a
crate's `[features]` table: a name and the features it enables. A `Request` is one dependency
line: a `dependent` crate asks for a `dependency` with a list of features. Write the three
functions that answer what Cargo will build, and why.

1. `expand(table: &[Feature], requested: &[&str]) -> BTreeSet<String>` returns every feature
   that is on once the requested ones are switched on.
   - Every requested feature is on.
   - If a feature is on, every feature in the `enables` list of its row is on too, and so on
     from row to row, however many steps that takes.
   - A name that has no row in the table is still on. It enables nothing.
   - A table may contain a cycle, such as two features that enable each other. The function
     must still finish.
2. `unify(requests: &[Request]) -> BTreeMap<String, BTreeSet<String>>` is feature
   unification: Cargo builds each dependency once, with the union of the features that all
   its dependents request.
   - The map has one entry for each dependency named in a request.
   - Its set holds every feature that any request for that dependency lists, exactly as
     written. Nothing is expanded here.
   - A dependency that is requested without features still has an entry, with an empty set.
3. `blame(table: &[Feature], requests: &[Request], dependency: &str, feature: &str) -> Vec<String>`
   names the crates that switch a feature on. `table` is the feature table of `dependency`.
   - A dependent is named if one of its requests for `dependency` lists the feature, or lists
     a feature that enables it in any number of steps. `expand` answers that.
   - Requests for other dependencies do not count.
   - The result is sorted, and each dependent appears once.

Each name has at most one row in a table. `BTreeSet` and `BTreeMap` keep their contents
sorted, which is why the results below print in alphabetical order.

Example:

```rust
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

expand(&table, &["full"])
// {"fast", "full", "secure", "std"}

unify(&requests)
// {"codec": {}, "hasher": {"fast", "full", "secure"}}

blame(&table, &requests, "hasher", "fast")
// ["api", "cli"]: `cli` never wrote `fast`, it asked for `full`

blame(&table, &requests, "hasher", "std")
// ["cli", "report"]
```

`report` asked only for `secure` and `api` only for `fast`, yet `hasher` is built once with
both. That is why a feature may add code and must never remove or replace any.
