"""Juice Bar Sums: fruit used, prices per kilogram and the sales trend, with linear algebra."""

import numpy as np


def fruit_needed(sales, recipes):
    """Kilograms of each fruit used each day: (days, drinks) and (drinks, fruits) give (days, fruits)."""
    return sales @ recipes


def fruit_prices(deliveries, totals):
    """The prices per kilogram for which deliveries @ prices equals totals."""
    return np.linalg.solve(deliveries, totals)


def trend(weeks, sold):
    """(slope, intercept) of the least-squares line sold = slope * week + intercept."""
    design = np.stack([weeks, np.ones_like(weeks)], axis=1)
    (slope, intercept), *_ = np.linalg.lstsq(design, sold)
    return float(slope), float(intercept)
