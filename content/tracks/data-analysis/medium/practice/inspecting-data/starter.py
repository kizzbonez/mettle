"""Loans Check: quick looks at the library's weekly loans export.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import pandas as pd


def missing_counts(frame):
    """The number of missing values in each column, in column order."""
    raise NotImplementedError


def category_report(column):
    """Distinct values, missing values, the most common value and its share of the values present."""
    # Return a dict with the keys "distinct", "missing", "top" and "top_share".
    raise NotImplementedError


def spot_check(frame, n, seed):
    """n random rows, the same ones for the same seed."""
    raise NotImplementedError


def numeric_summary(frame):
    """describe() of the frame, rounded to 2 decimals."""
    raise NotImplementedError
