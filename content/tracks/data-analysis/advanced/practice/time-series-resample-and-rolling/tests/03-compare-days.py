import numpy as np
import pandas as pd

daily = pd.Series(
    [10.0, 12.5, 9.0, 9.0, 4.5],
    index=pd.DatetimeIndex(
        pd.to_datetime(["2026-05-30", "2026-05-31", "2026-06-02", "2026-06-03", "2026-06-05"]), name="time"
    ),
    name="kwh",
)
before = daily.copy()
result = compare_days(daily)
assert isinstance(result, pd.DataFrame), "compare_days returns a DataFrame"
assert result.columns.tolist() == ["kwh", "change", "pct"], "compare_days has the columns kwh, change and pct"
expected = pd.DataFrame(
    {
        "kwh": [10.0, 12.5, np.nan, 9.0, 9.0, np.nan, 4.5],
        "change": [np.nan, 2.5, np.nan, np.nan, 0.0, np.nan, np.nan],
        "pct": [np.nan, 0.25, np.nan, np.nan, 0.0, np.nan, np.nan],
    },
    index=pd.DatetimeIndex(pd.date_range("2026-05-30", periods=7, freq="D"), name="time"),
)
check_frame(
    result,
    expected,
    "compare_days puts back the skipped dates and compares each date with the calendar day before, not the row before",
    check_freq=False,
)
check_frame(daily, before, "compare_days does not change the daily Series")

rounding = pd.Series(
    [3.0, 4.0, 3.3333],
    index=pd.DatetimeIndex(pd.date_range("2026-08-01", periods=3, freq="D"), name="time"),
    name="kwh",
)
check_frame(
    compare_days(rounding)[["change", "pct"]],
    pd.DataFrame(
        {"change": [np.nan, 1.0, -0.67], "pct": [np.nan, 0.333, -0.167]},
        index=rounding.index,
    ),
    "change is rounded to 2 decimals and pct to 3",
    check_freq=False,
)
