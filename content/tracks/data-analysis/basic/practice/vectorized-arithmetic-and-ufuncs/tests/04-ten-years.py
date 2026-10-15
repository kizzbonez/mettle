# Ten years of trips, one month of half a million trips at a time: sixty million trips in all.
# Only whole-array code gets through this within the time limit.
import warnings

import numpy as np

TRIPS = 500_000
rng = np.random.default_rng(2026)
months = []
for _ in range(4):
    km = np.round(rng.uniform(0.0, 45.0, TRIPS), 1)
    km[::97] = 0.0
    waiting = rng.integers(0, 40, TRIPS).astype(np.float64)
    months.append((km, waiting))


def priced(km, waiting):
    fare = fares(km, waiting)
    assert isinstance(fare, np.ndarray) and fare.shape == (TRIPS,), "fares returns one fare for each of a month's trips"
    with warnings.catch_warnings():
        warnings.simplefilter("error")
        try:
            rate = per_km(fare, km)
        except RuntimeWarning:
            raise AssertionError("per_km divides a month of trips without a RuntimeWarning") from None
    assert isinstance(rate, np.ndarray) and rate.shape == (TRIPS,), "per_km returns one value for each of a month's trips"
    return fare, rate


km, waiting = months[0]
fare, rate = priced(km, waiting)
check_array(fare, np.round(np.clip(3.0 + 1.8 * km + 0.3 * waiting, 5.0, 80.0), 2), "the fares of a month of trips")
assert np.isnan(rate[km == 0.0]).all(), "every trip of 0 km in the month gives NaN"
moved = km > 0
check_array(rate[moved], np.round(fare[moved] / km[moved], 2), "per_km of a month of trips")

for month in range(1, 120):
    km, waiting = months[month % 4]
    priced(km, waiting)
