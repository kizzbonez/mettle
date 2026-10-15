import numpy as np
import pandas as pd

log = pd.DataFrame(
    {
        "day": ["d1", "d2", "d3", "d4", "d5", "d6"],
        "steps": [5000.0, np.nan, 7000.0, np.nan, np.nan, 4000.0],
        "sleep_h": [7.0, 8.0, np.nan, np.nan, 6.0, 6.5],
        "resting_hr": [np.nan, 61.0, 60.0, np.nan, np.nan, 59.0],
        "workouts": [np.nan, 1.0, 0.0, 2.0, np.nan, 0.0],
    },
    index=[40, 41, 42, 43, 44, 45],
)
before = log.copy()

check_frame(
    usable_days(log),
    log.loc[[41, 42, 45]],
    "usable_days keeps the days with 3 or 4 readings, counting only the four readings and not day",
)
check_frame(log, before, "usable_days leaves log as it was")

sparse = log.loc[[40, 43, 44]]
kept = usable_days(sparse)
assert len(kept) == 0 and list(kept.columns) == list(log.columns), "no usable day gives an empty frame with every column"

full = pd.DataFrame(
    {"day": ["x"], "steps": [1.0], "sleep_h": [2.0], "resting_hr": [3.0], "workouts": [4.0]}
)
check_frame(usable_days(full), full, "a day with all four readings is usable")
