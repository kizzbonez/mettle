"""Pond Dipping: counts, depths and temperatures with the right dtypes."""

import numpy as np


def net_totals(first, second):
    """The two nets' uint8 counts added together, as int64, without wrapping past 255."""
    return first.astype(np.int64) + second.astype(np.int64)


def whole_cm(depths):
    """The depths rounded to the nearest whole centimetre, as int64."""
    return np.round(depths).astype(np.int64)


def missing_temps(temps):
    """How many temperatures are NaN."""
    return int(np.isnan(temps).sum())
