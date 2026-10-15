"""Honey Stall: a beekeeper's prices and market-day sales in pandas."""

import pandas as pd


def price_list(prices):
    """A Series of the prices, indexed by honey name in the dict's order, named 'price'."""
    return pd.Series(prices, name="price")


def price_changes(old, new):
    """new minus old, matched by honey name; NaN for a honey in only one of them."""
    return new - old


def market_day(sales):
    """A DataFrame with one row per sale record and one column per key."""
    return pd.DataFrame(sales)


def takings(day):
    """The sum over all rows of price times sold."""
    return (day["price"] * day["sold"]).sum()


def text_columns(frame):
    """The names of the columns whose dtype is str, in column order."""
    return [name for name in frame.columns if frame[name].dtype == "str"]
