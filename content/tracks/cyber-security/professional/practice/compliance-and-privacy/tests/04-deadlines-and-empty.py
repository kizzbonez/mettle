# due_date at month ends and year ends, and a run with no requests.
import json

cases = [
    ("2026-09-14", "2026-10-14"),
    ("2026-01-31", "2026-02-28"),
    ("2028-01-31", "2028-02-29"),
    ("2026-12-15", "2027-01-15"),
    ("2026-08-31", "2026-09-30"),
    ("2026-03-31", "2026-04-30"),
    ("2026-02-28", "2026-03-28"),
]
for received, due in cases:
    got = due_date(received)
    assert got == due, f"due_date({received!r}): one month later, or the last day of a shorter month"

people = [{"id": "Z-1", "name": "Zara Quinn", "email": "zara@example.com", "marketing": True, "restricted": False}]
with open("t4-members.json", "w") as f:
    json.dump(people, f)
with open("t4-invoices.csv", "w") as f:
    f.write("invoice,member,date\n")
with open("t4-holds.json", "w") as f:
    f.write("[]\n")
with open("t4-requests.csv", "w") as f:
    f.write("request,received,member,type,field,value\n")
members, outcomes = apply_requests("t4-members.json", "t4-invoices.csv", "t4-holds.json", "t4-requests.csv", "2026-10-16")
assert outcomes == [], "no requests give no outcomes"
assert members == {"Z-1": people[0]}, "with no requests every member is unchanged, keyed by id"
