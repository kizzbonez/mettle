"""Curry House Orders: give the web form's text columns their real types.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import pandas as pd

SPICE = pd.CategoricalDtype(["mild", "medium", "hot", "fiery"], ordered=True)


def clean_types(orders):
    """spice as an ordered category, price as float64, qty as Int64, paid as bool."""
    raise NotImplementedError


def unreadable(orders, column):
    """The values of column that are present but are not numbers, in row order."""
    raise NotImplementedError


def at_least(clean, level):
    """The orders of spice level or hotter, mildest first, ties in their order."""
    raise NotImplementedError


def price_in_pence(clean):
    """Each price in whole pence, rounded, as Int64."""
    raise NotImplementedError
