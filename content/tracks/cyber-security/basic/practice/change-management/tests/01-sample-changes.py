# The example from the instructions: the six requests in data/changes.json.
lines = review("data/changes.json")
expected = [
    "CHG-3101 OK",
    "CHG-3102 OUTSIDE-WINDOW,OUT-OF-SCOPE",
    "CHG-3103 NO-OWNER",
    "CHG-3104 NO-BACKOUT",
    "CHG-3105 OK",
    "CHG-3106 NOT-APPROVED,UNTESTED,OUTSIDE-WINDOW",
]
for want, got in zip(expected, lines):
    change_id = want.split()[0]
    assert got == want, f"review line for {change_id} in data/changes.json: got {got!r}"
assert len(lines) == len(expected), "review should return one line per request"
