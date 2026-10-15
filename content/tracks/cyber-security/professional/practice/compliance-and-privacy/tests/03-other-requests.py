# Opt-out, objection, restriction and correction, with a hold, unknown fields and types.
import json

people = [
    {"id": "Q-1", "name": "Kofi Mensah", "email": "kofi@example.com", "marketing": True, "restricted": False},
    {"id": "Q-2", "name": "Ines Duarte", "email": "ines@example.com", "marketing": True, "restricted": False},
    {"id": "Q-3", "name": "Mila Horvat", "email": "mila@example.com", "marketing": True, "restricted": False},
    {"id": "Q-4", "name": "Owen Price", "email": "owen@example.com", "marketing": True, "restricted": False},
]
with open("t3-members.json", "w") as f:
    json.dump(people, f)
with open("t3-invoices.csv", "w") as f:
    f.write("invoice,member,date\n")
with open("t3-holds.json", "w") as f:
    json.dump([{"hold": "H-9", "matter": "regulator inquiry", "members": ["Q-2"], "released": None}], f)
with open("t3-requests.csv", "w") as f:
    f.write(
        "request,received,member,type,field,value\n"
        "S-1,2026-11-03,Q-1,correction,name,Kofi Mensah-Boateng\n"
        "S-2,2026-11-03,Q-2,correction,email,ines.duarte@example.com\n"
        "S-3,2026-11-04,Q-2,opt-out,,\n"
        "S-4,2026-11-04,Q-2,restriction,,\n"
        "S-5,2026-11-05,Q-3,correction,phone,+351 900 000 000\n"
        "S-6,2026-11-05,Q-3,portability,,\n"
        "S-8,2026-11-06,Q-4,correction,email,owen.price@example.com\n"
        "S-9,2026-11-06,Q-1,objection,,\n"
        "S-7,2026-11-02,Q-4,erasure,,\n"
    )

members, outcomes = apply_requests("t3-members.json", "t3-invoices.csv", "t3-holds.json", "t3-requests.csv", "2026-12-01")
assert outcomes == [
    "S-7 erased", "S-1 done", "S-2 held", "S-3 done", "S-4 done",
    "S-5 rejected", "S-6 rejected", "S-8 not-found", "S-9 done",
], "outcomes of corrections, opt-outs, objections, restrictions and unknown types, in date then id order"
assert members["Q-1"] == {"id": "Q-1", "name": "Kofi Mensah-Boateng", "email": "kofi@example.com", "marketing": False, "restricted": False}, (
    "a corrected name and an objection to marketing"
)
assert members["Q-2"] == {"id": "Q-2", "name": "Ines Duarte", "email": "ines@example.com", "marketing": False, "restricted": True}, (
    "under a hold, a correction is held but opt-out and restriction apply"
)
assert members["Q-3"] == people[2], "rejected requests change nothing"
assert "Q-4" not in members, "an erased member is removed"
