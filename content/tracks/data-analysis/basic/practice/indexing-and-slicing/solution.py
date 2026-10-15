"""Library Loans: pieces of the weekly loans table, as views or as a changed copy."""

import numpy as np


def weekend(loans):
    """Saturday and Sunday of every branch, shape (branches, 2), as a view of loans."""
    return loans[:, 5:]


def newest_first(loans, branch):
    """One branch's seven counts, Sunday first, as a 1-D view of loans."""
    return loans[branch, ::-1]


def closed_early_week(loans, branch):
    """A new array like loans with the branch's Monday to Wednesday set to 0; loans unchanged."""
    closed = loans.copy()
    closed[branch, :3] = 0
    return closed
