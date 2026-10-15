import numpy as np

loans = np.array([
    [52, 48, 50, 61, 70, 95, 40],
    [30, 28, 35, 33, 41, 60, 22],
    [12, 15, 11, 14, 19, 25, 0],
])
before = loans.copy()

days_off = weekend(loans)
assert isinstance(days_off, np.ndarray) and days_off.shape == (3, 2), "weekend of the example has one row per branch and two columns"
check_array(days_off, np.array([[95, 40], [60, 22], [25, 0]]), "weekend of the example")
assert np.shares_memory(days_off, loans), "weekend returns a view of loans, not a copy"

backwards = newest_first(loans, 1)
assert isinstance(backwards, np.ndarray) and backwards.shape == (7,), "newest_first returns a one-dimensional array of seven counts"
check_array(backwards, np.array([22, 60, 41, 33, 35, 28, 30]), "newest_first(loans, 1) of the example")
assert np.shares_memory(backwards, loans), "newest_first returns a view of loans, not a copy"

closed = closed_early_week(loans, -1)
check_array(closed, np.array([
    [52, 48, 50, 61, 70, 95, 40],
    [30, 28, 35, 33, 41, 60, 22],
    [0, 0, 0, 14, 19, 25, 0],
]), "closed_early_week(loans, -1) of the example", strict=True)
check_array(loans, before, "closed_early_week leaves loans unchanged, as in the example", strict=True)
