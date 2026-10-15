"""Watch Log: weekly figures from a smartwatch log with gaps."""

import pandas as pd

READINGS = ["steps", "sleep_h", "resting_hr", "workouts"]


def gap_shares(log):
    """The share of missing values in each column, rounded to 3 decimals."""
    return log.isna().mean().round(3)


def step_summary(log):
    """Total, mean and number of the days with steps."""
    steps = log["steps"]
    return {"total": steps.sum(min_count=1), "mean": steps.mean(), "days": steps.count()}


def usable_days(log):
    """The days with at least 3 of the 4 readings present."""
    return log.dropna(thresh=3, subset=READINGS)


def fill_log(log):
    """steps interpolated, sleep carried forward one day, missing workouts 0 as Int64."""
    return log.assign(
        steps=pd.col("steps").interpolate().round(),
        sleep_h=pd.col("sleep_h").ffill(limit=1),
        workouts=pd.col("workouts").fillna(0).astype("Int64"),
    )
