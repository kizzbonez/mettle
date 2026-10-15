import numpy as np
import pandas as pd

index = pd.DatetimeIndex(
    pd.to_datetime(
        [
            "2026-04-01",
            "2026-04-02",
            "2026-04-03",
            "2026-04-06",
            "2026-04-07",
            "2026-04-10",
            "2026-04-15",
            "2026-04-16",
            "2026-04-20",
        ]
    ),
    name="time",
)
daily = pd.Series([5.0, 7.0, 6.0, 9.0, np.nan, 4.0, 8.0, 10.0, 3.0], index=index, name="kwh")
before = daily.copy()
result = smooth(daily)
assert isinstance(result, pd.DataFrame), "smooth returns a DataFrame"
assert result.columns.tolist() == ["kwh", "week_avg", "record"], "smooth has the columns kwh, week_avg and record"
expected = pd.DataFrame(
    {
        "kwh": [5.0, 7.0, 6.0, 9.0, np.nan, 4.0, 8.0, 10.0, 3.0],
        "week_avg": [5.0, 6.0, 6.0, 6.75, 6.75, 6.5, 6.0, 7.33, 7.0],
        "record": [5.0, 7.0, 7.0, 9.0, 9.0, 9.0, 9.0, 10.0, 10.0],
    },
    index=index,
)
check_frame(
    result,
    expected,
    "smooth averages the values present in the last 7 calendar days, not the last 7 rows, keeps the rows given and tracks the record",
)
check_frame(daily, before, "smooth does not change the daily Series")

single = pd.Series([2.5], index=pd.DatetimeIndex(pd.to_datetime(["2026-09-09"]), name="time"), name="kwh")
check_frame(
    smooth(single),
    pd.DataFrame({"kwh": [2.5], "week_avg": [2.5], "record": [2.5]}, index=single.index),
    "smooth of a single date",
)
