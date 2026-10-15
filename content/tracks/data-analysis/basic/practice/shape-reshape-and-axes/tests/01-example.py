import numpy as np

daily = np.array([40, 35, 38, 42, 55, 80, 72, 41, 33, 39, 45, 60, 85, 70])
weeks = by_week(daily)
assert isinstance(weeks, np.ndarray) and weeks.shape == (2, 7), "by_week of the example has one row per week"
check_array(weeks, np.array([[40, 35, 38, 42, 55, 80, 72], [41, 33, 39, 45, 60, 85, 70]]), "by_week of the example")

totals = weekday_totals(daily)
assert isinstance(totals, np.ndarray) and totals.shape == (7,), "weekday_totals has one value per day of the week"
check_array(totals, np.array([81, 68, 77, 87, 115, 165, 142]), "weekday_totals of the example")

both = side_by_side(np.array([40, 35, 38]), np.array([22, 19, 25]))
assert isinstance(both, np.ndarray) and both.shape == (3, 2), "side_by_side of the example has one row per day"
check_array(both, np.array([[40, 22], [35, 19], [38, 25]]), "side_by_side of the example")
