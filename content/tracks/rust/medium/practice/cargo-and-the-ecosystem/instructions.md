Cargo itself does not run in the sandbox, so this lab has you write its rules as code.
`Version`, `Version::new` and `parse_version` are complete in the starter. `Version` derives
its ordering, so `<` and `>=` compare the major number first, then the minor, then the patch.

In this lab a valid requirement is three numbers, such as `1.2.3`, with or without an `=` in
front. Anything else is not a requirement.

1. `upper_bound(version: Version) -> Version` is the first version that a requirement written
   as `version` no longer allows. The leftmost number that is not zero must not change, so it
   is the next value of that number with zeros after it: `1.2.3` gives `2.0.0`, `0.2.3` gives
   `0.3.0`, and `0.0.3` gives `0.0.4`. When all three numbers are zero, the patch counts as
   the leftmost.
2. `allows(requirement: &str, version: Version) -> bool` says whether a requirement accepts a
   version.
   - `=1.2.3` accepts exactly the version 1.2.3.
   - `1.2.3` accepts every version from 1.2.3 itself up to, but not including, its upper
     bound.
   - A requirement that `parse_version` cannot read, with or without the `=`, accepts
     nothing.
3. `newest_allowed(requirement: &str, published: &[Version]) -> Option<Version>` is what
   `cargo update` moves the lock file to: the newest of the published versions that the
   requirement allows, or `None` when it allows none of them. The versions come in no
   particular order.
4. `enabled_features(defaults, requested, default_features) -> Vec<&str>` lists the features
   of a dependency that end up switched on: the requested ones, together with the default
   ones unless `default_features` is `false`. Each feature appears once, in alphabetical
   order. `defaults` and `requested` are slices of `&str`, and `default_features` is a
   `bool`. The full signature, with its lifetime, is in the starter.

Example:

```rust
upper_bound(Version::new(1, 2, 3))             // Version::new(2, 0, 0)
upper_bound(Version::new(0, 2, 3))             // Version::new(0, 3, 0)
upper_bound(Version::new(0, 0, 3))             // Version::new(0, 0, 4)

allows("1.2.3", Version::new(1, 9, 0))         // true
allows("1.2.3", Version::new(2, 0, 0))         // false
allows("0.2.3", Version::new(0, 3, 0))         // false
allows("=1.2.3", Version::new(1, 2, 4))        // false

let published = [
    Version::new(1, 2, 3),
    Version::new(1, 4, 0),
    Version::new(2, 0, 1),
    Version::new(1, 3, 9),
];
newest_allowed("1.2.3", &published)            // Some(Version::new(1, 4, 0))

enabled_features(&["std"], &["derive", "std"], true)     // ["derive", "std"]
enabled_features(&["std"], &["derive"], false)           // ["derive"]
```
