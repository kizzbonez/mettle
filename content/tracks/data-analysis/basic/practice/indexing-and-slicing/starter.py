"""Library Loans: pieces of the weekly loans table, as views or as a changed copy.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters. loans has one row per branch and 7 columns, Monday first.
"""

import numpy as np


def weekend(loans):
    """Saturday and Sunday of every branch, shape (branches, 2), as a view of loans."""
    # TODO: one slice for the rows, one for the columns.
    raise NotImplementedError


def newest_first(loans, branch):
    """One branch's seven counts, Sunday first, as a 1-D view of loans."""
    # TODO: an index for the row, a slice with a negative step for the days.
    raise NotImplementedError


def closed_early_week(loans, branch):
    """A new array like loans with the branch's Monday to Wednesday set to 0; loans unchanged."""
    # TODO: copy first, then assign 0 to a slice of the copy.
    raise NotImplementedError
