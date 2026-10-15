"""Watch Log: weekly figures from a smartwatch log with gaps.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters, and never change `log` itself.
"""

import pandas as pd

READINGS = ["steps", "sleep_h", "resting_hr", "workouts"]


def gap_shares(log):
    """The share of missing values in each column, rounded to 3 decimals."""
    raise NotImplementedError


def step_summary(log):
    """Total, mean and number of the days with steps."""
    # Return a dict with the keys "total", "mean" and "days".
    raise NotImplementedError


def usable_days(log):
    """The days with at least 3 of the 4 readings present."""
    raise NotImplementedError


def fill_log(log):
    """steps interpolated, sleep carried forward one day, missing workouts 0 as Int64."""
    raise NotImplementedError
