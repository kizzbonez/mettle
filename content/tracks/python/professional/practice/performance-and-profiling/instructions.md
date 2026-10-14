Write three functions in `solution.py`. Each has an obvious slow version; write the fast one.

1. `first_repeat(scans)` takes a list of parcel codes (strings) in the order they were scanned
   and returns the first code that is scanned **a second time**, or `None` when every code is
   different. In `["P1", "P2", "P2", "P1"]` it is `"P2"`: its second scan comes before `P1`'s.
   Make it one pass, O(n): remember the codes you have seen in a `set`, not a list.
2. `smallest_gap(times)` takes a list of departure times (integers, minutes after midnight, in
   any order, possibly repeated) and returns the smallest difference between any two of them,
   or `None` when there are fewer than two. Do not compare every pair, which is O(n²): sort a
   copy once, O(n log n), and compare neighbours. Do not change the list you were given.
3. `route_minutes(stops, lookup)` takes the list of stops of a route and a function
   `lookup(origin, destination)` that asks the slow map service how many minutes one leg takes.
   It returns the total for the legs `stops[0]` to `stops[1]`, `stops[1]` to `stops[2]`, and so
   on (`0` for fewer than two stops). Call `lookup` **at most once for each distinct
   `(origin, destination)` pair** during one call: wrap it with `functools.cache` (or keep a
   `dict`) **inside** `route_minutes`, so that every call starts with an empty cache, because
   the service's answers change with the traffic between calls.

**How it is judged.** The tests count the calls to `lookup`, and give `first_repeat` and
`smallest_gap` a few hundred thousand items: the O(n) and O(n log n) versions finish in a fraction
of a second, while the O(n²) versions would need many minutes and run out of the 5 second limit.
Nothing is timed.

**Example.**

```python
first_repeat(["P1", "P2", "P2", "P1"])      # 'P2'
first_repeat(["P1", "P2", "P3"])            # None
smallest_gap([420, 395, 480, 400, 455])     # 5, between 395 and 400


def lookup(origin, destination):
    print("asking about", origin, destination)
    return {("depot", "mill"): 12, ("mill", "depot"): 14, ("depot", "quay"): 9}[(origin, destination)]


route_minutes(["depot", "mill", "depot", "mill", "depot", "quay"], lookup)   # 61
```

The last call prints only three `asking about` lines, for `depot mill`, `mill depot` and
`depot quay`: the legs `depot` to `mill` and `mill` to `depot` come twice, but each is asked
about once. `12 + 14 + 12 + 14 + 9` is 61.
