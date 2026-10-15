# availability: one node, several nodes, and the edge values.
import math

cases = [
    ((4000, 8), {}, 4000 / 4008, "one node with MTBF 4000 h and MTTR 8 h"),
    ((4000, 8), {"nodes": 1}, 4000 / 4008, "nodes=1 given explicitly"),
    ((1000, 10), {"nodes": 3}, 1 - (10 / 1010) ** 3, "three nodes"),
    ((8760, 0), {}, 1.0, "a node that is repaired instantly"),
    ((720, 24), {"nodes": 2}, 1 - (24 / 744) ** 2, "two nodes with a long repair time"),
    ((99, 1), {}, 0.99, "MTBF 99 h and MTTR 1 h, given as integers"),
]
for args, kwargs, expected, what in cases:
    got = availability(*args, **kwargs)
    assert isinstance(got, float), f"availability returns a float for {what}"
    assert math.isclose(got, expected, rel_tol=1e-12), f"availability for {what}"

assert availability(500, 20, nodes=2) > availability(500, 20), "a second node raises availability"
assert availability(500, 10) > availability(500, 20), "a shorter MTTR raises availability"
