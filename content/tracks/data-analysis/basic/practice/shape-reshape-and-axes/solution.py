"""Tea Room Weeks: lay out a run of daily sales by week, and join two tea rooms."""

import numpy as np


def by_week(daily):
    """The daily counts as a (weeks, 7) array: one row per week, Monday in column 0."""
    return daily.reshape(-1, 7)


def weekday_totals(daily):
    """The total for each day of the week over all the weeks: 7 values, Monday first."""
    return by_week(daily).sum(axis=0)


def side_by_side(station, pier):
    """A (days, 2) array: the station's counts in column 0, the pier's in column 1."""
    return np.stack([station, pier], axis=1)
