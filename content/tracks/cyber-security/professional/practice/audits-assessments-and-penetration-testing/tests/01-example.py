# The example from the instructions.
scope = {"in": ["203.0.113.0/27", "portal.ashgrove.example", "10.40.0.0/16"],
         "out": ["10.40.9.0/24", "payments.ashgrove.example"]}
assert in_scope("203.0.113.31", scope) is True, "in_scope('203.0.113.31') should be True: the last address of the /27"
assert in_scope("10.40.9.15", scope) is False, "in_scope('10.40.9.15') should be False: inside the excluded /24"
assert in_scope("10.40.0.0/16", scope) is False, "in_scope('10.40.0.0/16') should be False: it overlaps 10.40.9.0/24"

got = review_plan("data/roe.json", "data/plan.csv")
expected = [
    "P-01 approved", "P-02 approved", "P-03 approved", "P-04 refused: out of scope",
    "P-05 refused: out of scope", "P-06 refused: outside window", "P-07 approved",
    "P-08 refused: forbidden technique", "P-09 refused: outside window",
    "P-10 refused: out of scope", "P-11 refused: out of scope",
    "P-12 refused: unknown technique", "P-13 refused: outside window",
]
assert isinstance(got, list) and len(got) == len(expected), f"review_plan should return {len(expected)} strings, one per activity"
for want, have in zip(expected, got):
    assert have == want, f"the decision for {want.split()[0]} should be {want!r}, not {have!r}"
