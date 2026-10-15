import io

import pandas as pd

TEXT = {"visit_id": "str", "pet": "str", "species": "str", "date": "str", "weight_kg": "float64"}
HEADER = "visit_id,pet,species,date,weight_kg\n"

visits = pd.read_csv(
    io.StringIO(
        HEADER
        + "A1,   ,dog,2026-01-05,10.0\n"
        + "A2,Pip, RABBIT ,2026-01-05,0.1\n"
        + "A3,Ziggy,,2026-01-05,5.0\n"
        + "A4,Bo,hamster,2026-01-06,0.1\n"
        + "A5,Nell,dog,2026-04-31,12.0\n"
        + "A6,Moss,cat,05/01/2026,4.0\n"
        + "A7,Ivy,dog,2026-01-07,90.0\n"
        + "A8,Rufus,dog,2026-01-07,90.5\n"
        + "A9,Dot,cat,2026-01-07,0.09\n"
        + "A10, Fern ,cat,2026-01-08,\n"
        + "A11,,fish,2026-02-30,\n"
        + "A12,Sky,Dog,,7.5\n"
    ),
    dtype=TEXT,
)
visits.index = [40, 7, 23, 3, 18, 31, 9, 12, 5, 27, 44, 1]
before = visits.copy()

result = find_reasons(visits)
assert isinstance(result, pd.Series), "find_reasons returns a Series"
check_frame(
    result,
    pd.Series(
        [
            "missing pet",
            "",
            "unknown species",
            "unknown species",
            "bad date",
            "bad date",
            "",
            "bad weight",
            "bad weight",
            "bad weight",
            "missing pet",
            "bad date",
        ],
        index=visits.index,
        name="reason",
        dtype="str",
    ),
    "find_reasons applies the rules in order (blank pets, cleaned species, impossible dates, the weight limits, "
    "missing values) and keeps the frame's own index",
)
check_frame(visits, before, "find_reasons does not change the frame it is given")

one = pd.read_csv(io.StringIO(HEADER + "Z9,,hamster,2026-13-01,-1\n"), dtype=TEXT)
check_frame(
    find_reasons(one),
    pd.Series(["missing pet"], name="reason", dtype="str"),
    "a row that breaks every rule gets the first reason only",
)
