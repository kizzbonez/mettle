use std::collections::BTreeMap;

// first_visits
assert!(first_visits(&[]).is_empty(), "no names give no visitors");
assert!(first_visits(&["Noor"]) == ["Noor"], "one name is one visitor");
assert!(
    first_visits(&["Zed", "Mia", "Ada"]) == ["Zed", "Mia", "Ada"],
    "names that are all different come back in the order they were given, not sorted"
);
assert!(
    first_visits(&["Mia", "Mia", "Mia"]) == ["Mia"],
    "a name that is repeated back to back is listed once"
);
assert!(
    first_visits(&["Zed", "Ada", "Zed", "Mia", "Ada", "Zed"]) == ["Zed", "Ada", "Mia"],
    "a name is listed where it first appears, and repeats that are far apart are still dropped"
);
assert!(
    first_visits(&["ada", "Ada", "ADA"]) == ["ada", "Ada", "ADA"],
    "names are compared exactly, so different capitals make different visitors"
);

// minutes_by_kind
assert!(minutes_by_kind(&[]).is_empty(), "no repairs give an empty map");
assert!(
    minutes_by_kind(&[("radio", 35)]) == BTreeMap::from([("radio", 35)]),
    "a kind that was repaired once has the minutes of that one repair"
);
let totals = minutes_by_kind(&[
    ("toaster", 15),
    ("bike", 40),
    ("toaster", 5),
    ("zip", 12),
    ("bike", 25),
    ("toaster", 30),
]);
assert!(totals.len() == 3, "the map has one entry for each kind, however often the kind was repaired");
assert!(totals.get("toaster") == Some(&50), "the minutes of three repairs of one kind are added up");
assert!(totals.get("bike") == Some(&65), "the minutes of two repairs of one kind are added up");
assert!(totals.get("zip") == Some(&12), "a kind that came once keeps its minutes");
assert!(totals.get("kettle") == None, "a kind that was never repaired has no entry");

let kinds: Vec<&str> = totals.keys().copied().collect();
assert!(kinds == ["bike", "toaster", "zip"], "the kinds come out of the map in alphabetical order");

assert!(
    minutes_by_kind(&[("clock", 0), ("clock", 0)]) == BTreeMap::from([("clock", 0)]),
    "a kind whose repairs took no time still has an entry, with a total of 0"
);
