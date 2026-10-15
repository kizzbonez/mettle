"""Meter Readings: a household's electricity use, day by day.

Every `raise NotImplementedError` marks code you still have to write. Use resample,
asfreq, diff, pct_change, rolling and expanding: no loops over rows or dates.
"""

import pandas as pd


def daily_use(readings):
    """Total kWh of every date from the first to the last, missing for a date without readings."""
    # resample needs a DatetimeIndex (or on="time"). What does an empty day sum to?
    raise NotImplementedError


def compare_days(daily):
    """Every date with kwh, the change from the day before and that change as a fraction."""
    raise NotImplementedError


def smooth(daily):
    """kwh, the mean of the last 7 calendar days and the highest day so far."""
    raise NotImplementedError
