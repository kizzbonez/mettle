import numpy as np

daily = np.array([
    10, 0, 3, 4, 5, 20, 30,
    11, 1, 3, 4, 6, 21, 30,
    12, 2, 3, 4, 7, 22, 30,
])
before = daily.copy()
totals = weekday_totals(daily)
assert isinstance(totals, np.ndarray) and totals.shape == (7,), "weekday_totals has seven values whatever the number of weeks"
check_array(totals, np.array([33, 3, 9, 12, 18, 63, 90]), "weekday_totals adds each day of the week over all the weeks")
check_array(daily, before, "weekday_totals does not change the daily array", strict=True)

one_week = np.array([9, 8, 7, 6, 5, 4, 3])
check_array(weekday_totals(one_week), one_week, "with one week, each weekday total is that day's count")

closed = weekday_totals(np.zeros(14, dtype=np.int64))
check_array(closed, np.zeros(7, dtype=np.int64), "two closed weeks total zero on every day")
