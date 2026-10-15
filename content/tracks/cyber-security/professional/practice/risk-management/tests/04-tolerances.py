# check_register: boundaries of the tolerances, mixed-case treatments and an empty register.
import json


def risk(rid, owner, likelihood, impact, value, ef, aro, treatment, **extra):
    entry = {"id": rid, "risk": f"risk {rid}", "owner": owner, "likelihood": likelihood, "impact": impact,
             "asset_value": value, "exposure_factor": ef, "aro": aro, "treatment": treatment}
    entry.update(extra)
    return entry


register = [
    risk("E-1", "COO", 3, 5, 500_000, 0.5, 1, "Accept", signed_by="COO"),
    risk("E-2", "COO", 4, 5, 1_000_000, 0.6, 1, "accept", signed_by="COO", board_approved=True),
    risk("E-3", "CIO", 1, 2, 601_001, 0.5, 1, "accept", board_approved="yes"),
    risk("E-4", "CIO", 2, 2, 100_000, 0.5, 0.5, "MITIGATE",
         control={"exposure_factor": 0.25, "aro": 0.5, "annual_cost": 12_500}),
    risk("E-5", "", 2, 3, 80_000, 0.5, 0.2, "transfer"),
    risk("E-6", "CIO", 4, 3, 150_000, 0.4, 0.5, "avoid"),
    risk("E-8", "HR Director", 2, 2, 30_000, 0.2, 1, "tolerate"),
    risk("E-9", "CIO", 3, 4, 700_000, 0.3, 0.2, "mitigate",
         control={"exposure_factor": 0.1, "aro": 0.1, "annual_cost": 10_000}),
]
with open("t4-register.json", "w") as f:
    json.dump(register, f)

got = check_register("t4-register.json")
assert got == [
    "ACCEPT-TOO-HIGH E-2 (score 20)",
    "NEEDS-BOARD E-3 (ALE 300500.50)",
    "UNSIGNED E-3",
    "NOT-WORTH E-4 (value 0.00)",
    "NO-OWNER E-5",
    "BAD-TREATMENT E-8 (tolerate)",
], (
    "an ALE of exactly 250,000, board approval only when true, a missing signature, "
    "a control worth exactly 0, and treatments in any case"
)

with open("t4-empty.json", "w") as f:
    f.write("[]\n")
assert check_register("t4-empty.json") == [], "an empty register has no findings"
