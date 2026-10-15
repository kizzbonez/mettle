"""Hostel Nights: bookings across a youth hostel network, by hostel and month."""

import pandas as pd


def monthly_table(bookings):
    """Total nights and number of bookings per (hostel, month), sorted."""
    return bookings.groupby(["hostel", "month"]).agg(nights=("nights", "sum"), stays=("nights", "size"))


def window(table, first, last, month_from, month_to):
    """The rows from hostel first to last and month month_from to month_to, ends included."""
    idx = pd.IndexSlice
    return table.sort_index().loc[idx[first:last, month_from:month_to], :]


def month_ranking(table, month):
    """Each hostel's nights in one month, most first, ties in hostel order."""
    nights = table.xs(month, level="month")["nights"].sort_index()
    return nights.sort_values(ascending=False, kind="stable")


def flat(table):
    """One row per hostel and one column of nights per month, 0 where none, as plain columns."""
    return table["nights"].unstack("month", fill_value=0).reset_index()
