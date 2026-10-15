import numpy as np
import pandas as pd

log = pd.DataFrame(
    {
        "day": ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"],
        "steps": [np.nan, np.nan, 3000.0, np.nan, np.nan, np.nan, 4000.0, np.nan],
        "sleep_h": [np.nan, 7.0, np.nan, np.nan, np.nan, 6.0, np.nan, 8.0],
        "resting_hr": [60.0, np.nan, 62.0, np.nan, 61.0, np.nan, 59.0, np.nan],
        "workouts": [np.nan, 1.0, np.nan, np.nan, 3.0, 0.0, np.nan, np.nan],
    },
    index=[5, 6, 7, 8, 9, 10, 11, 12],
)
before = log.copy()
filled = fill_log(log)
check_frame(log, before, "fill_log leaves log as it was")
assert list(filled.columns) == list(log.columns), "fill_log keeps the same columns in the same order"
check_frame(filled.index, log.index, "fill_log keeps the index")

check_frame(
    filled["steps"],
    pd.Series([np.nan, np.nan, 3000.0, 3250.0, 3500.0, 3750.0, 4000.0, 4000.0], index=log.index, name="steps"),
    "steps: gaps before the first recorded day stay NaN, gaps between lie on a line, a gap at the end takes the last value",
)
check_frame(
    filled["sleep_h"],
    pd.Series([np.nan, 7.0, 7.0, np.nan, np.nan, 6.0, 6.0, 8.0], index=log.index, name="sleep_h"),
    "sleep_h: a gap takes the previous day's value for one day only, and nothing fills a gap before the first value",
)
assert str(filled["workouts"].dtype) == "Int64", "workouts becomes Int64"
assert filled["workouts"].tolist() == [0, 1, 0, 0, 3, 0, 0, 0], "a missing workout count is 0"
check_frame(filled[["day", "resting_hr"]], before[["day", "resting_hr"]], "day and resting_hr are unchanged")

odd = pd.DataFrame(
    {
        "day": ["a", "b", "c", "d"],
        "steps": [1000.0, np.nan, np.nan, 2000.0],
        "sleep_h": [7.0, 7.5, 8.0, 8.0],
        "resting_hr": [60.0, 60.0, 60.0, 60.0],
        "workouts": [0.0, 0.0, 1.0, 0.0],
    }
)
assert fill_log(odd)["steps"].tolist() == [1000.0, 1333.0, 1667.0, 2000.0], "interpolated steps are rounded to whole steps"
