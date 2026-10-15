"""Taxi Fares: price millions of trips with whole-array arithmetic and ufuncs."""

import numpy as np


def fares(km, waiting):
    """3.00 + 1.80 per km + 0.30 per waiting minute, kept within 5.00 to 80.00, rounded to 2 places."""
    raw = 3.00 + 1.80 * km + 0.30 * waiting
    return np.round(np.clip(raw, 5.00, 80.00), 2)


def per_km(fare, km):
    """fare / km rounded to 2 places; NaN for a trip of 0 km, without a RuntimeWarning."""
    with np.errstate(divide="ignore", invalid="ignore"):
        ratio = fare / km
    return np.round(np.where(km > 0, ratio, np.nan), 2)
