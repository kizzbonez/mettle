# risk(): every cell of the matrix, case and spaces, and ratings that are not allowed.
table = {
    ("high", "low"): "medium", ("high", "medium"): "high", ("high", "high"): "critical",
    ("medium", "low"): "low", ("medium", "medium"): "medium", ("medium", "high"): "high",
    ("low", "low"): "low", ("low", "medium"): "low", ("low", "high"): "medium",
}
for (likelihood, impact), level in table.items():
    assert risk(likelihood, impact) == level, f"risk({likelihood!r}, {impact!r}) should follow the matrix"

assert risk("LOW", " High ") == "medium", "risk should ignore case and surrounding spaces"
assert risk("Medium\t", "medium") == "medium", "risk should ignore a trailing tab"

for likelihood, impact in [("severe", "high"), ("high", ""), ("med", "low"), ("high", "very high")]:
    try:
        risk(likelihood, impact)
    except ValueError:
        continue
    raise AssertionError(f"risk({likelihood!r}, {impact!r}) should raise ValueError")
