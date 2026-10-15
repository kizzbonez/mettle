"""Juice Bar Sums: fruit used, prices per kilogram and the sales trend, with linear algebra.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters.
"""

import numpy as np


def fruit_needed(sales, recipes):
    """Kilograms of each fruit used each day: (days, drinks) and (drinks, fruits) give (days, fruits)."""
    # TODO: a matrix product, not an element-wise one.
    raise NotImplementedError


def fruit_prices(deliveries, totals):
    """The prices per kilogram for which deliveries @ prices equals totals."""
    # TODO: np.linalg.solve.
    raise NotImplementedError


def trend(weeks, sold):
    """(slope, intercept) of the least-squares line sold = slope * week + intercept."""
    # TODO: a design matrix of weeks and ones, then np.linalg.lstsq.
    raise NotImplementedError
