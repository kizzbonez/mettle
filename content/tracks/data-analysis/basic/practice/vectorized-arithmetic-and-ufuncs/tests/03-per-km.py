import warnings

import numpy as np


def quietly(function, *args):
    """Calls FUNCTION with warnings turned into errors."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error")
            return function(*args)
    except RuntimeWarning:
        raise AssertionError("per_km divides without NumPy printing a RuntimeWarning") from None


fare = np.array([5.0, 12.0, 7.5, 5.0, 33.0])
km = np.array([0.0, 4.0, 0.0, 0.3, 9.0])
before = (fare.copy(), km.copy())
result = quietly(per_km, fare, km)
assert isinstance(result, np.ndarray) and result.shape == (5,), "per_km returns one value per trip"
check_array(result, [np.nan, 3.0, np.nan, 16.67, 3.67], "per_km gives NaN for 0 km and rounds the rest to 2 places")
check_array(fare, before[0], "per_km does not change fare")
check_array(km, before[1], "per_km does not change km")

none = quietly(per_km, np.array([5.0, 5.0]), np.array([0.0, 0.0]))
assert np.isnan(none).all() and none.shape == (2,), "every trip of 0 km gives NaN"

table = quietly(per_km, np.array([[10.0, 5.0], [9.0, 80.0]]), np.array([[3.0, 0.0], [2.0, 64.0]]))
check_array(table, [[3.33, np.nan], [4.5, 1.25]], "per_km keeps the shape of two-dimensional input")
