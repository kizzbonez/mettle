import io

import pandas as pd

TEXT = {"visit_id": "str", "pet": "str", "species": "str", "date": "str", "weight_kg": "float64"}
visits = pd.read_csv(
    io.StringIO(
        "visit_id,pet,species,date,weight_kg\n"
        "B1,Ash,cat,2026-01-05,4.0\n"
        "B2,Bea,dog,2026-01-05,8.0\n"
        "B1,Ash,cat,2026-01-05,4.2\n"
        "B2,Bea,dog,2026-01-05,8.5\n"
        "B3,Cal,dog,2026-01-06,300\n"
        "B1,Ash,cat,2026-01-05,4.1\n"
        "B3,Cal,dog,2026-01-06,30\n"
        "B4,Dee,cat,2026-01-06,3.0\n"
        "B5,Eve,cat,2026-01-07,3.3\n"
        "B5,,cat,2026-01-07,3.3\n"
    ),
    dtype=TEXT,
)

check_frame(
    find_reasons(visits),
    pd.Series(
        ["replaced", "replaced", "replaced", "", "bad weight", "", "", "", "replaced", "missing pet"],
        name="reason",
        dtype="str",
    ),
    "every row with a later row of the same visit_id is replaced, unless an earlier rule already failed it, "
    "and the last row of a visit is judged by the other rules alone",
)

clean, quarantine = split_visits(visits)
check_frame(
    clean[["visit_id", "weight_kg"]],
    pd.DataFrame({"visit_id": ["B2", "B1", "B3", "B4"], "weight_kg": [8.5, 4.1, 30.0, 3.0]}),
    "clean keeps only the last row of each visit that passes the rules, in the order of the export",
)
check_frame(
    reason_counts(quarantine),
    pd.Series([1, 1, 4], index=pd.Index(["bad weight", "missing pet", "replaced"], name="reason"), name="count"),
    "reason_counts counts the replaced rows and the other reasons, in alphabetical order",
)
