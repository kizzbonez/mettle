# The example from the instructions.
assert first_repeat(["P1", "P2", "P2", "P1"]) == "P2", "first_repeat(['P1', 'P2', 'P2', 'P1']) should be 'P2'"
assert first_repeat(["P1", "P2", "P3"]) is None, "first_repeat(['P1', 'P2', 'P3']) should be None"
assert smallest_gap([420, 395, 480, 400, 455]) == 5, "smallest_gap([420, 395, 480, 400, 455]) should be 5"

asked = []


def lookup(origin, destination):
    asked.append((origin, destination))
    return {("depot", "mill"): 12, ("mill", "depot"): 14, ("depot", "quay"): 9}[(origin, destination)]


total = route_minutes(["depot", "mill", "depot", "mill", "depot", "quay"], lookup)
assert total == 61, f"route_minutes for the example route should be 61, not {total}"
assert sorted(asked) == [("depot", "mill"), ("depot", "quay"), ("mill", "depot")], (
    f"lookup should be asked once about each of the three different legs; it was asked {asked}"
)
