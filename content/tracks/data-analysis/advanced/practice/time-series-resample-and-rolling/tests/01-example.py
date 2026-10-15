import numpy as np
import pandas as pd

readings = pd.read_csv("data/meter.csv", parse_dates=["time"])
days = pd.DatetimeIndex(pd.date_range("2026-03-01", periods=7, freq="D"), name="time")

daily = daily_use(readings)
expected_daily = pd.Series([7.6, 8.1, 7.5, np.nan, 9.0, 5.6, 8.7], index=days, name="kwh")
check_frame(daily, expected_daily, "daily_use of the example meter readings", check_freq=False)

expected_compare = pd.DataFrame(
    {
        "kwh": [7.6, 8.1, 7.5, np.nan, 9.0, 5.6, 8.7],
        "change": [np.nan, 0.5, -0.6, np.nan, np.nan, -3.4, 3.1],
        "pct": [np.nan, 0.066, -0.074, np.nan, np.nan, -0.378, 0.554],
    },
    index=days,
)
check_frame(compare_days(expected_daily), expected_compare, "compare_days of the example daily use", check_freq=False)

expected_smooth = pd.DataFrame(
    {
        "kwh": [7.6, 8.1, 7.5, np.nan, 9.0, 5.6, 8.7],
        "week_avg": [7.6, 7.85, 7.73, 7.73, 8.05, 7.56, 7.75],
        "record": [7.6, 8.1, 8.1, 8.1, 9.0, 9.0, 9.0],
    },
    index=days,
)
check_frame(smooth(expected_daily), expected_smooth, "smooth of the example daily use", check_freq=False)
