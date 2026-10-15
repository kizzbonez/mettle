import numpy as np

km = np.array([2.3, 0.0, 12.5, 60.0, 0.8])
waiting = np.array([4.0, 3.0, 10.0, 25.0, 0.0])
fare = fares(km, waiting)
assert isinstance(fare, np.ndarray) and fare.shape == (5,), "fares returns one fare per trip"
check_array(fare, [8.34, 5.0, 28.5, 80.0, 5.0], "fares of the example trips")
check_array(per_km(fare, km), [3.63, np.nan, 2.28, 1.33, 6.25], "per_km of the example trips")
