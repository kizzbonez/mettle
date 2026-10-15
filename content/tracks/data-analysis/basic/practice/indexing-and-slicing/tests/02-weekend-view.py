import numpy as np

loans = np.arange(35).reshape(5, 7)
days_off = weekend(loans)
assert isinstance(days_off, np.ndarray) and days_off.shape == (5, 2), "weekend keeps one row per branch and two columns"
check_array(days_off[:, 0], loans[:, 5].copy(), "column 0 of weekend is Saturday")
check_array(days_off[:, 1], loans[:, 6].copy(), "column 1 of weekend is Sunday")
assert np.shares_memory(days_off, loans), "weekend is a view of loans"

days_off[0, 0] = -1
assert loans[0, 5] == -1, "writing through weekend reaches loans, because it is a view"

one = np.array([[3, 1, 4, 1, 5, 9, 2]])
alone = weekend(one)
assert alone.shape == (1, 2), "a table of one branch gives a weekend of one row, still two-dimensional"
check_array(alone, np.array([[9, 2]]), "the weekend of a single branch")
assert np.shares_memory(alone, one), "weekend of a single branch is a view too"
