"""Tea Room Weeks: lay out a run of daily sales by week, and join two tea rooms.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters. daily is a 1-D array of whole weeks, day 0 a Monday.
"""

import numpy as np


def by_week(daily):
    """The daily counts as a (weeks, 7) array: one row per week, Monday in column 0."""
    # TODO: reshape, with -1 for the number of weeks.
    raise NotImplementedError


def weekday_totals(daily):
    """The total for each day of the week over all the weeks: 7 values, Monday first."""
    # TODO: sum the weekly table along the axis that should disappear.
    raise NotImplementedError


def side_by_side(station, pier):
    """A (days, 2) array: the station's counts in column 0, the pier's in column 1."""
    # TODO: np.stack along the right axis.
    raise NotImplementedError
