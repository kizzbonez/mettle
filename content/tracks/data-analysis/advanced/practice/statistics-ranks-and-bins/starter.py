"""Giant Vegetable Class: places, weight bands and suspicious weights at the village show.

Every `raise NotImplementedError` marks code you still have to write. Use rank, cut,
crosstab, quantile, mean and std: no loops over rows.
"""

import numpy as np
import pandas as pd

BANDS = ["small", "medium", "large", "giant"]


def places(entries):
    """Each entry's place within its vegetable: heaviest 1, ties share it, no gaps."""
    raise NotImplementedError


def band_shares(entries):
    """The share of each vegetable's entries in each weight band; every band is a column."""
    raise NotImplementedError


def outlier_report(kg):
    """The z-score of each weight and whether the 1.5 x IQR rule flags it."""
    raise NotImplementedError
