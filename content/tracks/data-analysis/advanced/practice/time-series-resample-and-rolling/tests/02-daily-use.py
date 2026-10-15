import numpy as np
import pandas as pd

readings = pd.DataFrame(
    {
        "time": pd.to_datetime(
            [
                "2026-11-03 00:00",
                "2026-11-01 08:15",
                "2026-11-02 23:59",
                "2026-11-01 19:45",
                "2026-11-05 13:00",
                "2026-11-02 07:30",
                "2026-11-03 18:00",
                "2026-11-06 00:00",
            ]
        ),
        "kwh": [0.0, 2.25, 1.5, 3.5, 0.0, 0.75, 0.0, 4.125],
    },
    index=[11, 12, 13, 14, 15, 16, 17, 18],
)
before = readings.copy()
daily = daily_use(readings)
assert isinstance(daily, pd.Series), "daily_use returns a Series"
assert isinstance(daily.index, pd.DatetimeIndex), "daily_use has a DatetimeIndex"
expected = pd.Series(
    [5.75, 2.25, 0.0, np.nan, 0.0, 4.12],
    index=pd.DatetimeIndex(pd.date_range("2026-11-01", periods=6, freq="D"), name="time"),
    name="kwh",
)
check_frame(
    daily,
    expected,
    "daily_use sums each date from midnight to midnight, gives 0 for readings of 0, a gap for a date without readings, and rounds to 2",
    check_freq=False,
)
check_frame(readings, before, "daily_use does not change the readings")

one = daily_use(pd.DataFrame({"time": pd.to_datetime(["2026-12-24 17:00"]), "kwh": [1.5]}))
check_frame(
    one,
    pd.Series([1.5], index=pd.DatetimeIndex(pd.to_datetime(["2026-12-24"]), name="time"), name="kwh"),
    "a single reading gives a single date",
    check_freq=False,
)
