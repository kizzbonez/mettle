"""Pond Dipping: counts, depths and temperatures with the right dtypes.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters, and do not change the arrays you are given.
"""

import numpy as np


def net_totals(first, second):
    """The two nets' uint8 counts added together, as int64, without wrapping past 255."""
    # TODO: convert to a wide enough dtype before adding.
    raise NotImplementedError


def whole_cm(depths):
    """The depths rounded to the nearest whole centimetre, as int64."""
    # TODO: round first, then convert; converting alone cuts the fraction off.
    raise NotImplementedError


def missing_temps(temps):
    """How many temperatures are NaN."""
    # TODO: == np.nan is always False.
    raise NotImplementedError
