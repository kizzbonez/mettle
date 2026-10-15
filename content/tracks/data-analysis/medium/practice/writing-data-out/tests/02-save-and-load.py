from pathlib import Path

import numpy as np
import pandas as pd

size = pd.CategoricalDtype(["small", "medium", "large"], ordered=True)
week = pd.DataFrame(
    {
        "customer": ["Novak", "Abebe", "Price", "Quinn", "Rossi"],
        "delivered": pd.to_datetime(["2026-07-06", None, "2026-07-07", "2026-07-08", "2026-07-08"]),
        "size": pd.Categorical(["medium", "medium", "large", "large", "medium"], dtype=size),
        "weight_kg": [5.5, 5.25, np.nan, 7.125, 4.0],
        "bags_returned": pd.array([None, 1, 3, None, 0], dtype="Int64"),
    },
    index=pd.Index(["C10", "C07", "C22", "C03", "C15"], name="box_id"),
)
before = week.copy()

save(week, "t2-week.csv")
check_frame(week, before, "save leaves deliveries unchanged")
plain = pd.read_csv("t2-week.csv")
assert list(plain.columns) == ["box_id", "customer", "delivered", "size", "weight_kg", "bags_returned"], (
    "the saved CSV has box_id first, then the other columns in order"
)
assert plain["box_id"].tolist() == ["C10", "C07", "C22", "C03", "C15"], "the saved CSV keeps the boxes in order"

loaded = load("t2-week.csv")
check_frame(loaded, week, "load gives back the saved frame: index, values, gaps and dtypes")
assert list(loaded["size"].cat.categories) == ["small", "medium", "large"] and loaded["size"].cat.ordered, (
    "size keeps all three categories, in order, although no box was small"
)

Path("t2-office.csv").write_text(
    "box_id,customer,delivered,size,weight_kg,bags_returned\n"
    "D01,Ivanova,2026-08-03,small,2.5,1\n"
    "D02,Okoro,2026-08-03,small,3.0,2\n",
    encoding="utf-8",
)
office = load("t2-office.csv")
expected = pd.DataFrame(
    {
        "customer": ["Ivanova", "Okoro"],
        "delivered": pd.to_datetime(["2026-08-03", "2026-08-03"]),
        "size": pd.Categorical(["small", "small"], dtype=size),
        "weight_kg": [2.5, 3.0],
        "bags_returned": pd.array([1, 2], dtype="Int64"),
    },
    index=pd.Index(["D01", "D02"], name="box_id"),
)
check_frame(office, expected, "load reads any file in the layout, with bags_returned as Int64 even without gaps")
