"""Plot Register: change the allotment register where asked, and only there.

Every `raise NotImplementedError` marks code you still have to write.
mark_paid and raise_rent CHANGE plots; late_list and rent_array must NOT.
"""

import pandas as pd


def mark_paid(plots, holder):
    """Set paid to True for every plot of holder, in plots itself."""
    raise NotImplementedError


def raise_rent(plots, percent):
    """Multiply every rent in plots by 1 + percent / 100, rounded to 2 decimals."""
    raise NotImplementedError


def late_list(plots, fee):
    """A new frame of the unpaid plots with fee added to their rent; plots unchanged."""
    raise NotImplementedError


def rent_array(plots):
    """The rents as a NumPy array the caller may write to."""
    raise NotImplementedError
