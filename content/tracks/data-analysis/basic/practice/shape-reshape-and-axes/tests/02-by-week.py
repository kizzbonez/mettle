import numpy as np

daily = np.arange(1, 29)
before = daily.copy()
weeks = by_week(daily)
assert isinstance(weeks, np.ndarray) and weeks.shape == (4, 7), "four weeks give four rows of seven days"
check_array(weeks[0], np.arange(1, 8), "the first row is the first week, Monday to Sunday")
check_array(weeks[:, 0], np.array([1, 8, 15, 22]), "column 0 holds every Monday, in order")
check_array(weeks[3], np.arange(22, 29), "the last row is the last week")
check_array(daily, before, "by_week does not change the daily array", strict=True)

single = by_week(np.array([5, 6, 7, 8, 9, 10, 11]))
assert single.shape == (1, 7), "a single week gives one row, still two-dimensional"
check_array(single, np.array([[5, 6, 7, 8, 9, 10, 11]]), "the counts of a single week")

none = by_week(np.array([], dtype=np.int64))
assert none.shape == (0, 7), "no days at all give no rows of seven columns"
