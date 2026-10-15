import numpy as np


def least_squares(x, y):
    """The least-squares slope and intercept, from the textbook formula."""
    slope = ((x - x.mean()) * (y - y.mean())).sum() / ((x - x.mean()) ** 2).sum()
    return slope, y.mean() - slope * x.mean()


weeks = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
sold = 2.5 * weeks + 10.0
before = (weeks.copy(), sold.copy())
line = trend(weeks, sold)
assert isinstance(line, tuple) and len(line) == 2, "trend returns a tuple (slope, intercept)"
slope, intercept = line
assert np.isclose(slope, 2.5) and np.isclose(intercept, 10.0), "trend finds a line that fits every point exactly"
check_array(weeks, before[0], "trend does not change weeks")
check_array(sold, before[1], "trend does not change sold")

weeks = np.array([3.0, 7.0, 8.0, 12.0, 15.0, 20.0, 21.0, 26.0])
sold = np.array([40.0, 38.5, 45.0, 41.0, 36.0, 30.5, 33.0, 25.0])
check_array(np.array(trend(weeks, sold), dtype=float), least_squares(weeks, sold), "trend of sales that are falling, with noise")

check_array(np.array(trend(np.array([2.0, 6.0]), np.array([10.0, 30.0])), dtype=float), [5.0, 0.0], "trend through two points", atol=1e-9)
flat = trend(np.array([1.0, 2.0, 3.0, 4.0]), np.array([12.0, 12.0, 12.0, 12.0]))
check_array(np.array(flat, dtype=float), [0.0, 12.0], "trend of flat sales has a slope of 0", atol=1e-9)
