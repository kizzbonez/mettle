"""Plot Register: change the allotment register where asked, and only there."""

import pandas as pd


def mark_paid(plots, holder):
    """Set paid to True for every plot of holder, in plots itself."""
    plots.loc[plots["holder"] == holder, "paid"] = True


def raise_rent(plots, percent):
    """Multiply every rent in plots by 1 + percent / 100, rounded to 2 decimals."""
    plots["rent"] = (plots["rent"] * (1 + percent / 100)).round(2)


def late_list(plots, fee):
    """A new frame of the unpaid plots with fee added to their rent; plots unchanged."""
    late = plots[~plots["paid"]]
    late["rent"] = late["rent"] + fee
    return late


def rent_array(plots):
    """The rents as a NumPy array the caller may write to."""
    return plots["rent"].to_numpy().copy()
