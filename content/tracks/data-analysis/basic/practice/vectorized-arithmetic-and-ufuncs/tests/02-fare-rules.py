import numpy as np

# Fares that would be 3.00, 4.98, 5.16, 79.86 and 80.04 before the limits, and two with long waits.
km = np.array([0.0, 1.1, 1.2, 42.7, 42.8, 5.0, 3.3])
waiting = np.array([0.0, 0.0, 0.0, 0.0, 0.0, 120.0, 7.0])
before = (km.copy(), waiting.copy())
fare = fares(km, waiting)
assert isinstance(fare, np.ndarray) and fare.shape == (7,), "fares returns one fare per trip"
check_array(fare, [5.0, 5.0, 5.16, 79.86, 80.0, 48.0, 11.04], "fares raises low fares to 5.00, caps high ones at 80.00 and charges for waiting")
assert np.array_equal(fare, np.round(fare, 2)), "fares are rounded to 2 decimal places"
check_array(km, before[0], "fares does not change km")
check_array(waiting, before[1], "fares does not change waiting")

table = fares(np.array([[2.3, 10.0], [0.4, 41.0]]), np.array([[4.0, 0.0], [2.0, 2.0]]))
assert isinstance(table, np.ndarray) and table.shape == (2, 2), "fares keeps the shape of two-dimensional input"
check_array(table, [[8.34, 21.0], [5.0, 77.4]], "fares of a two-dimensional table of trips")

many = fares(np.arange(500) / 10, np.full(500, 3.0))
assert np.array_equal(many, np.round(many, 2)), "every fare is rounded to 2 decimal places"
assert many.min() == 5.0 and many.max() == 80.0, "no fare is below 5.00 or above 80.00"
