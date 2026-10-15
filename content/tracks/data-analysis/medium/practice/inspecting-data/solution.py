"""Loans Check: quick looks at the library's weekly loans export."""

import pandas as pd


def missing_counts(frame):
    """The number of missing values in each column, in column order."""
    return len(frame) - frame.count()


def category_report(column):
    """Distinct values, missing values, the most common value and its share of the values present."""
    shares = column.value_counts(normalize=True)
    return {
        "distinct": column.nunique(),
        "missing": len(column) - column.count(),
        "top": shares.index[0],
        "top_share": round(shares.iloc[0], 3),
    }


def spot_check(frame, n, seed):
    """n random rows, the same ones for the same seed."""
    return frame.sample(n, random_state=seed)


def numeric_summary(frame):
    """describe() of the frame, rounded to 2 decimals."""
    return frame.describe().round(2)
