import numpy as np
import pandas as pd

log = pd.DataFrame(
    {
        "day": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "steps": [8200, None, None, 11000, 6400, None, 9100],
        "sleep_h": [7.5, 6.0, None, None, 8.0, 7.0, None],
        "resting_hr": [58, 60, None, 57, None, 59, 61],
        "workouts": [1, None, 0, 2, None, 1, 0],
    }
)
before = log.copy()

check_frame(
    gap_shares(log),
    pd.Series([0.0, 0.429, 0.429, 0.286, 0.286], index=["day", "steps", "sleep_h", "resting_hr", "workouts"]),
    "gap_shares of the example log",
)
assert step_summary(log) == {"total": 34700.0, "mean": 8675.0, "days": 4}, "step_summary of the example log"
assert usable_days(log)["day"].tolist() == ["Mon", "Thu", "Sat", "Sun"], "usable_days of the example log"
check_frame(
    fill_log(log),
    pd.DataFrame(
        {
            "day": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "steps": [8200.0, 9133.0, 10067.0, 11000.0, 6400.0, 7750.0, 9100.0],
            "sleep_h": [7.5, 6.0, 6.0, np.nan, 8.0, 7.0, 7.0],
            "resting_hr": [58, 60, None, 57, None, 59, 61],
            "workouts": pd.array([1, 0, 0, 2, 0, 1, 0], dtype="Int64"),
        }
    ),
    "fill_log of the example log",
)
check_frame(log, before, "the functions leave log as it was")
