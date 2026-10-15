"""Taxi Fares: price millions of trips with whole-array arithmetic and ufuncs.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters. No loops and no np.vectorize: a hidden test prices ten
years of trips, half a million a month.
"""

import numpy as np


def fares(km, waiting):
    """3.00 + 1.80 per km + 0.30 per waiting minute, kept within 5.00 to 80.00, rounded to 2 places."""
    # TODO: one arithmetic expression, then np.clip, then np.round.
    raise NotImplementedError


def per_km(fare, km):
    """fare / km rounded to 2 places; NaN for a trip of 0 km, without a RuntimeWarning."""
    # TODO: divide inside np.errstate(...), then np.where for the 0 km trips.
    raise NotImplementedError
