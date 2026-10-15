import math

import numpy as np
import pandas as pd

log = pd.DataFrame(
    {
        "day": ["2026-03-02", "2026-03-03", "2026-03-04"],
        "steps": [np.nan, np.nan, np.nan],
        "sleep_h": [6.5, 7.0, 7.25],
        "resting_hr": [np.nan, 64.0, 63.0],
        "workouts": [0.0, np.nan, 1.0],
    }
)
before = log.copy()
check_frame(
    gap_shares(log),
    pd.Series([0.0, 1.0, 0.0, 0.333, 0.333], index=["day", "steps", "sleep_h", "resting_hr", "workouts"]),
    "gap_shares gives 1.0 for a column of gaps, 0.0 for a full one, and rounds to 3 decimals",
)

nothing = step_summary(log)
assert set(nothing) == {"total", "mean", "days"}, "step_summary returns the three keys"
assert math.isnan(nothing["total"]), "with no steps recorded at all, total is NaN, not 0"
assert math.isnan(nothing["mean"]), "with no steps recorded at all, mean is NaN"
assert nothing["days"] == 0, "with no steps recorded at all, days is 0"

week = pd.DataFrame(
    {
        "day": ["a", "b", "c", "d", "e"],
        "steps": [12000.0, np.nan, 3000.0, np.nan, 0.0],
        "sleep_h": [np.nan] * 5,
        "resting_hr": [np.nan] * 5,
        "workouts": [np.nan] * 5,
    }
)
summary = step_summary(week)
assert summary["total"] == 15000.0, "total adds the steps recorded and skips the gaps"
assert summary["mean"] == 5000.0, "mean divides by the days with steps, a day of 0 steps included, not by every row"
assert summary["days"] == 3, "days counts the days with steps, a day of 0 steps included"

one = step_summary(week.iloc[[0]])
assert one == {"total": 12000.0, "mean": 12000.0, "days": 1}, "step_summary of a single day"
check_frame(log, before, "gap_shares and step_summary leave log as it was")
