import numpy as np

station = np.arange(10, 24)
pier = np.arange(100, 114)
both = side_by_side(station, pier)
assert isinstance(both, np.ndarray) and both.shape == (14, 2), "side_by_side has one row per day and two columns"
check_array(both[:, 0], station, "column 0 holds the station's counts in order")
check_array(both[:, 1], pier, "column 1 holds the pier's counts in order")
check_array(both[5], np.array([15, 105]), "each row pairs the two tea rooms on the same day")

one_day = side_by_side(np.array([7]), np.array([3]))
assert one_day.shape == (1, 2), "a single day gives one row of two columns"
check_array(one_day, np.array([[7, 3]]), "the two counts of a single day")

check_array(station, np.arange(10, 24), "side_by_side does not change the station's array", strict=True)
check_array(pier, np.arange(100, 114), "side_by_side does not change the pier's array", strict=True)
