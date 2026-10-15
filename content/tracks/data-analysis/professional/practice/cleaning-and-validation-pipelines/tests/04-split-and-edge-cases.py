import io

import pandas as pd

TEXT = {"visit_id": "str", "pet": "str", "species": "str", "date": "str", "weight_kg": "float64"}
HEADER = "visit_id,pet,species,date,weight_kg\n"

visits = pd.read_csv(
    io.StringIO(
        HEADER
        + "C1, Olive , CAT ,2026-02-01,4.5\n"
        + "C2,Toby, Dog ,2026-02-31,20.0\n"
        + "C3,Hazel,Rabbit,2026-02-02,2.0\n"
        + "C4, Nutmeg,dog,2026-02-02,95.0\n"
    ),
    dtype=TEXT,
)
visits.index = [30, 10, 20, 0]
before = visits.copy()

clean, quarantine = split_visits(visits)
check_frame(
    clean,
    pd.DataFrame({
        "visit_id": ["C1", "C3"],
        "pet": ["Olive", "Hazel"],
        "species": ["cat", "rabbit"],
        "date": pd.to_datetime(["2026-02-01", "2026-02-02"]).astype("datetime64[us]"),
        "weight_kg": [4.5, 2.0],
    }),
    "clean has the cleaned pet and species, parsed dates, the stated columns and the index 0 to n-1",
)
check_frame(
    quarantine,
    pd.DataFrame({
        "visit_id": ["C2", "C4"],
        "pet": ["Toby", " Nutmeg"],
        "species": [" Dog ", "dog"],
        "date": ["2026-02-31", "2026-02-02"],
        "weight_kg": [20.0, 95.0],
        "reason": ["bad date", "bad weight"],
    }),
    "quarantine keeps the bad rows exactly as given, adds their reason and has the index 0 to n-1",
)
check_frame(visits, before, "split_visits does not change the frame it is given")

good = visits.iloc[[0, 2]]
clean, quarantine = split_visits(good)
assert len(clean) == 2 and len(quarantine) == 0, "with no bad rows everything is kept and the quarantine is empty"
assert list(quarantine.columns) == ["visit_id", "pet", "species", "date", "weight_kg", "reason"], (
    "an empty quarantine still has the export's columns and reason"
)
assert len(reason_counts(quarantine)) == 0, "an empty quarantine has no reasons to count"

empty = pd.read_csv(io.StringIO(HEADER), dtype=TEXT)
reasons = find_reasons(empty)
assert isinstance(reasons, pd.Series) and len(reasons) == 0 and reasons.name == "reason", (
    "an export without rows gives an empty Series named reason"
)
clean, quarantine = split_visits(empty)
assert len(clean) == 0 and list(clean.columns) == ["visit_id", "pet", "species", "date", "weight_kg"], (
    "an export without rows gives an empty clean frame with the stated columns"
)
assert len(quarantine) == 0 and list(quarantine.columns) == ["visit_id", "pet", "species", "date", "weight_kg", "reason"], (
    "an export without rows gives an empty quarantine with the export's columns and reason"
)
