# The example from the instructions.
import json
from datetime import date, datetime

with open("data/pharmacy-access.json") as handle:
    policy = json.load(handle)

cases = [
    ("a.mensah", "dispense", datetime(2026, 11, 12, 10, 30), ("allow", "role:pharmacist")),
    ("a.mensah", "dispense", datetime(2026, 11, 12, 21, 0), ("deny", "outside-hours")),
    ("r.quinn", "dispense", datetime(2026, 11, 13, 2, 15), ("allow", "role:night-pharmacist")),
    ("r.quinn", "approve-controlled", datetime(2026, 11, 13, 2, 15), ("deny", "not-granted")),
    ("it.dara", "admin-console", datetime(2026, 11, 12, 23, 59), ("allow", "jit:CHG-2291")),
    ("it.dara", "admin-console", datetime(2026, 11, 13, 0, 0), ("deny", "not-granted")),
    ("l.byrne", "approve-controlled", datetime(2026, 11, 12, 10, 0), ("deny", "not-granted")),
    ("s.ahmed", "pick", datetime(2026, 11, 12, 10, 0), ("deny", "expired")),
]
for user, permission, at, expected in cases:
    got = decide(policy, user, permission, at)
    assert tuple(got) == expected, f"decide(policy, {user!r}, {permission!r}, {at!r}), got {got!r}"

got = review(policy, date(2026, 11, 12))
assert got == [
    "EXPIRED s.ahmed 2026-10-31",
    "SOD p.walsh order-stock+receive-stock",
    "SOD m.fitz approve-controlled+view-audit",
    "JIT-INVALID l.byrne approve-controlled too-long",
    "JIT-INVALID it.dara dispense no-ticket",
], f"review(policy, date(2026, 11, 12)) for data/pharmacy-access.json, got {got!r}"
