# The example from the instructions.
import csv

with open("data/customers.csv", newline="") as handle:
    rows = list(csv.DictReader(handle))

protected = protect(rows, b"lumen-research-key-2026")
expected = [
    {"pid": "c82a4959360a", "area": "BS1", "age_band": "30-39", "card": "************1111", "plan": "fibre-500", "monthly_spend": "42.00"},
    {"pid": "3ea568dd5d77", "area": "BS6", "age_band": "50-59", "card": "************4444", "plan": "mobile-unl", "monthly_spend": "25.50"},
    {"pid": "719b05370c4b", "area": "BS1", "age_band": "90+", "card": "***********0005", "plan": "landline", "monthly_spend": "12.00"},
    {"pid": "520ecebfd0fe", "area": "BS1", "age_band": "30-39", "card": "************1117", "plan": "fibre-500", "monthly_spend": "42.00"},
    {"pid": "7c249f749399", "area": "BS6", "age_band": "40-49", "card": "", "plan": "mobile-10", "monthly_spend": "10.00"},
    {"pid": "140b5543516d", "area": "BS3", "age_band": "10-19", "card": "", "plan": "mobile-10", "monthly_spend": "10.00"},
    {"pid": "e70b9f85fe07", "area": "BS6", "age_band": "50-59", "card": "************4444", "plan": "fibre-100", "monthly_spend": "30.00"},
]
assert len(protected) == 7, f"protect should keep the 7 rows with consent, kept {len(protected)}"
for index, (got, want) in enumerate(zip(protected, expected)):
    assert got == want, f"record {index} of protect(rows of data/customers.csv), got {got!r}"

got = small_groups(protected, 2)
assert got == [("BS1", "90+", 1), ("BS3", "10-19", 1), ("BS6", "40-49", 1)], f"small_groups(protected, 2), got {got!r}"
