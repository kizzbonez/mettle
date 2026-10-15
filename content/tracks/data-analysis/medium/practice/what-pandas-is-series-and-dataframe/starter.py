"""Honey Stall: a beekeeper's prices and market-day sales in pandas.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import pandas as pd


def price_list(prices):
    """A Series of the prices, indexed by honey name in the dict's order, named 'price'."""
    # Build it straight from the dict.
    raise NotImplementedError


def price_changes(old, new):
    """new minus old, matched by honey name; NaN for a honey in only one of them."""
    # Arithmetic between two Series lines them up by label for you.
    raise NotImplementedError


def market_day(sales):
    """A DataFrame with one row per sale record and one column per key."""
    raise NotImplementedError


def takings(day):
    """The sum over all rows of price times sold."""
    raise NotImplementedError


def text_columns(frame):
    """The names of the columns whose dtype is str, in column order."""
    # Look at each column's dtype.
    raise NotImplementedError
