"""Curry House Orders: give the web form's text columns their real types."""

import pandas as pd

SPICE = pd.CategoricalDtype(["mild", "medium", "hot", "fiery"], ordered=True)


def clean_types(orders):
    """spice as an ordered category, price as float64, qty as Int64, paid as bool."""
    return orders.assign(
        spice=orders["spice"].astype(SPICE),
        price=pd.to_numeric(orders["price"], errors="coerce"),
        qty=pd.to_numeric(orders["qty"], errors="coerce").astype("Int64"),
        paid=orders["paid"].map({"Y": True, "N": False}),
    )


def unreadable(orders, column):
    """The values of column that are present but are not numbers, in row order."""
    numbers = pd.to_numeric(orders[column], errors="coerce")
    return orders.loc[numbers.isna() & orders[column].notna(), column].tolist()


def at_least(clean, level):
    """The orders of spice level or hotter, mildest first, ties in their order."""
    hot_enough = clean[clean["spice"] >= level]
    return hot_enough.sort_values("spice", kind="stable")


def price_in_pence(clean):
    """Each price in whole pence, rounded, as Int64."""
    return (clean["price"] * 100).round().astype("Int64")
