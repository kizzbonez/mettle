# The example from the instructions.
assert due_date("2026-09-14") == "2026-10-14", f"due_date('2026-09-14') should be '2026-10-14', not {due_date('2026-09-14')!r}"

result = apply_requests("data/members.json", "data/invoices.csv", "data/holds.json", "data/requests.csv", "2026-10-16")
assert isinstance(result, tuple) and len(result) == 2, "apply_requests should return a tuple (members, outcomes)"
members, outcomes = result
expected = [
    "DSR-0398 erased", "DSR-0405 restricted", "DSR-0409 held", "DSR-0410 done",
    "DSR-0411 done", "DSR-0412 done", "DSR-0415 not-found", "DSR-0416 rejected",
]
assert outcomes == expected, f"the outcomes for the example should be {expected!r}, not {outcomes!r}"
assert sorted(members) == ["M-1002", "M-1003", "M-1004", "M-1005"], f"members left after the requests, not {sorted(members)!r}"
assert members["M-1002"] == {"id": "M-1002", "name": "Jonas Berg", "email": "", "marketing": False, "restricted": True}, (
    f"M-1002 should be kept for its retained invoice with no email or marketing, not {members['M-1002']!r}"
)
assert members["M-1003"]["email"] == "lea.moreau@example.org", "M-1003 is under a legal hold and keeps its data"
assert members["M-1004"]["marketing"] is False, "M-1004's objection should stop marketing"
assert members["M-1005"]["email"] == "sofia.ricci@example.com", "M-1005's email should be corrected"
