# The example from the instructions.
expected = {
    "actors": {"hacktivist": 1, "crime syndicate": 2, "unskilled attacker": 2,
               "accidental insider": 1, "state-sponsored": 2, "insider": 1,
               "competitor": 1, "terrorist": 1, "unknown": 1},
    "internal": 2, "external": 10, "apt": ["INC-0480", "INC-0548"],
}
got = landscape("data/incidents.csv")
if got != expected:
    print("landscape('data/incidents.csv') returned:", got)
assert got == expected, "landscape of data/incidents.csv should match the example in the instructions"

row = {"id": "INC-0548", "origin": "external", "intent": "malicious", "motivation": "espionage",
       "resources": "high", "sophistication": "high", "dwell_days": "95"}
assert classify(row) == "state-sponsored", "an espionage motive should make the actor state-sponsored (rule 3)"
assert is_apt(row) is True, "95 days of access by a sophisticated, well-resourced external actor is an APT"
