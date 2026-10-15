# The example from the instructions.
got = review_actions("data/guardrails.json", "data/actions.jsonl")
expected = [
    "A-101 allow",
    "A-102 allow",
    "A-103 allow",
    "A-104 deny: tool not allowed",
    "A-105 deny: protected host",
    "A-106 hold: needs approval by soc-lead",
    "A-107 deny: too many rows",
    "A-108 allow",
    "A-109 allow",
    "A-110 deny: rate limit",
    "A-111 allow",
    "A-112 deny: tool not allowed",
]
assert isinstance(got, list), "review_actions should return a list of strings"
assert len(got) == len(expected), f"review_actions should return one string per action ({len(expected)}), not {len(got)}"
for want, have in zip(expected, got):
    assert have == want, f"the decision for {want.split()[0]} should be {want!r}, not {have!r}"
