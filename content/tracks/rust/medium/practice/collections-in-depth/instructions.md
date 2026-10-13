Write the four functions. Each one is a few lines once the right collection does the work:
a `VecDeque`, a `HashSet`, a `BTreeMap` with its entry API, and `sort_by`. The lifetime `'a`
in the signatures only says that the results hold the same `&str` values as the input, so
nothing has to be copied with `to_string`.

1. `serving_order<'a>(arrivals: &[(&'a str, bool)]) -> Vec<&'a str>` receives the items in
   the order they arrive, each with a flag that says whether it is urgent. An ordinary item
   joins the back of the queue. An urgent item goes to the very front, ahead of everything
   that is waiting, earlier urgent items included. Return the queue from front to back.
2. `first_visits<'a>(names: &[&'a str]) -> Vec<&'a str>` receives the name written down for
   every repair. Return each name once, in the order the names first appear. Names are
   compared exactly, so `ada` and `Ada` are two visitors.
3. `minutes_by_kind<'a>(repairs: &[(&'a str, u32)]) -> BTreeMap<&'a str, u32>` receives one
   pair for every repair: the kind of item and the minutes it took. Return the total minutes
   for each kind. A `BTreeMap` keeps the kinds in alphabetical order.
4. `slowest_first<'a>(repairs: &[(&'a str, u32)]) -> Vec<(&'a str, u32)>` returns the same
   pairs sorted by minutes, the largest first. Repairs that took equally long stay in the
   order they had in the input.

Example:

```rust
serving_order(&[("toaster", false), ("radio", false), ("wheelchair", true), ("lamp", false), ("glasses", true)])
// ["glasses", "wheelchair", "toaster", "radio", "lamp"]

first_visits(&["Ada", "Bo", "Ada", "Cy", "Bo"])
// ["Ada", "Bo", "Cy"]

minutes_by_kind(&[("lamp", 20), ("chair", 45), ("lamp", 30), ("kettle", 10)])
// {"chair": 45, "kettle": 10, "lamp": 50}

slowest_first(&[("radio", 20), ("clock", 45), ("lamp", 20), ("chair", 45), ("kettle", 10)])
// [("clock", 45), ("chair", 45), ("radio", 20), ("lamp", 20), ("kettle", 10)]
```
