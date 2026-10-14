# route_minutes: one lookup per distinct leg, a fresh cache for every call, and 200,000 stops.
calls = []
traffic = {}


def lookup(origin, destination):
    calls.append((origin, destination))
    return traffic[(origin, destination)]


traffic.update({("a", "b"): 5, ("b", "a"): 7, ("b", "c"): 4, ("c", "a"): 6})

assert route_minutes([], lookup) == 0 and route_minutes(["a"], lookup) == 0, "fewer than two stops make no legs: 0"
assert calls == [], "with fewer than two stops lookup should not be called"

stops = ["a", "b", "c"] * 66_667     # 200,001 stops, legs a-b, b-c, c-a over and over
total = route_minutes(stops, lookup)
assert total == 66_667 * 5 + 66_667 * 4 + 66_666 * 6, "the total of 200,000 legs"
assert len(calls) == 3, f"200,000 legs over 3 different (origin, destination) pairs should need 3 lookups, not {len(calls)}"

calls.clear()
assert route_minutes(["a", "b", "a", "b", "a"], lookup) == 24, "a route back and forth: a-b, b-a, a-b, b-a"
assert sorted(calls) == [("a", "b"), ("b", "a")], (
    "a-b and b-a are different legs, each asked about once, and every call should start with an empty cache"
)

traffic[("a", "b")] = 50                # rush hour: the service now gives another answer
calls.clear()
assert route_minutes(["a", "b"], lookup) == 50, (
    "a new call of route_minutes should ask the service again, not reuse an answer from an earlier call"
)
assert calls == [("a", "b")], "one leg should need exactly one lookup"
