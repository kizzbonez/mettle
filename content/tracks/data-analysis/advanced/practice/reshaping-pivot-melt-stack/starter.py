"""Running Club Log: reshape the club's distance sheets and kit orders.

Every `raise NotImplementedError` marks code you still have to write. Use melt,
pivot_table, explode and crosstab: no loops over rows or columns.
"""

import pandas as pd


def sheet_to_long(sheet):
    """One row per reported distance: runner, week, km, sorted by runner then week."""
    raise NotImplementedError


def weekly_totals(runs):
    """Total km per runner (rows) and week (columns), 0 where none, with All totals."""
    # A runner can log several runs in one week: say how to combine them.
    raise NotImplementedError


def kit_table(orders):
    """How often each kit item was ordered in each size."""
    raise NotImplementedError
