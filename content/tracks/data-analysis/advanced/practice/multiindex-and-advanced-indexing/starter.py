"""Hostel Nights: bookings across a youth hostel network, by hostel and month.

Every `raise NotImplementedError` marks code you still have to write. Work with the
MultiIndex (groupby, sort_index, pd.IndexSlice, xs, unstack, reset_index): no loops.
"""

import pandas as pd


def monthly_table(bookings):
    """Total nights and number of bookings per (hostel, month), sorted."""
    raise NotImplementedError


def window(table, first, last, month_from, month_to):
    """The rows from hostel first to last and month month_from to month_to, ends included."""
    # Slicing a MultiIndex needs a sorted index.
    raise NotImplementedError


def month_ranking(table, month):
    """Each hostel's nights in one month, most first, ties in hostel order."""
    raise NotImplementedError


def flat(table):
    """One row per hostel and one column of nights per month, 0 where none, as plain columns."""
    raise NotImplementedError
