# Erasure: the retention boundary, several invoices, active and released holds, repeats and unknown members.
import json

people = [{"id": f"P-{n}", "name": f"Person {n}", "email": f"p{n}@example.com", "marketing": True, "restricted": False}
          for n in range(1, 7)]
with open("t2-members.json", "w") as f:
    json.dump(people, f)
with open("t2-invoices.csv", "w") as f:
    f.write(
        "invoice,member,date\n"
        "INV-1,P-1,2020-03-10\n"
        "INV-2,P-2,2020-03-09\n"
        "INV-3,P-3,2015-01-01\n"
        "\n"
        "INV-4,P-3,2026-12-01\n"
        "INV-5,P-6,2018-06-30\n"
    )
with open("t2-holds.json", "w") as f:
    json.dump([
        {"hold": "H-1", "matter": "claim", "members": ["P-5"], "released": None},
        {"hold": "H-0", "matter": "old dispute", "members": ["P-6", "P-1"], "released": "2026-11-30"},
    ], f)
with open("t2-requests.csv", "w") as f:
    f.write(
        "request,received,member,type,field,value\n"
        "R-06,2027-02-20,P-2,erasure,,\n"
        "R-01,2027-02-10,P-1,erasure,,\n"
        "R-02,2027-02-10,P-2,erasure,,\n"
        "R-03,2027-02-11,P-3,erasure,,\n"
        "R-05,2027-02-12,P-5,erasure,,\n"
        "R-04,2027-02-12,P-4,erasure,,\n"
        "R-07,2027-02-13,P-6,erasure,,\n"
        "R-08,2027-02-14,P-9,erasure,,\n"
    )

members, outcomes = apply_requests("t2-members.json", "t2-invoices.csv", "t2-holds.json", "t2-requests.csv", "2027-03-10")
assert outcomes == [
    "R-01 restricted", "R-02 erased", "R-03 restricted", "R-04 erased",
    "R-05 held", "R-07 erased", "R-08 not-found", "R-06 not-found",
], "erasure outcomes: retention on the boundary day, holds active or released, requests in date then id order"
assert sorted(members) == ["P-1", "P-3", "P-5"], "only restricted and held members remain"
assert members["P-3"] == {"id": "P-3", "name": "Person 3", "email": "", "marketing": False, "restricted": True}, (
    "a member with one recent invoice among old ones is kept, restricted, with no email or marketing"
)
assert members["P-5"] == people[4], "a member under an active hold is not changed by erasure"
