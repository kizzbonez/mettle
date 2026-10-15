"""Brightwater village hall solar panels: load, clean and summarise the logger's daily readings.

Every `raise NotImplementedError` below marks code you still have to write.
Keep every function name and its parameters: the tests use them.
"""

import numpy as np


def load_energy(path):
    """Return the file's energy array: one row per day, one column per string, NaN for gaps."""
    # TODO 1: read the CSV (header line, then day,reading,reading,...) and drop the day column.
    raise NotImplementedError


def clean(energy, capacity):
    """Return a new array with readings below 0 or above capacity replaced by NaN."""
    # TODO 2: work on a copy; 0 and capacity themselves are kept.
    raise NotImplementedError


def daily_totals(energy):
    """Return each day's total, ignoring NaN, rounded to 2 places; NaN for a day with no readings."""
    raise NotImplementedError


def relative_output(energy):
    """Return each reading divided by its day's median, rounded to 3 places."""
    # TODO 4: a day whose median is 0 or NaN is NaN throughout.
    raise NotImplementedError


def underperformers(energy, threshold=0.8):
    """Return the ascending column positions of strings whose median relative output is below threshold."""
    raise NotImplementedError


def spot_check_days(energy, k, seed):
    """Return k different days (row positions, ascending) drawn from the days with any reading."""
    # TODO 6: rng = np.random.default_rng(seed), then one call to
    #         rng.choice(candidates, size=k, replace=False).
    raise NotImplementedError
