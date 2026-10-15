"""Bakery Rounds: price the cafés' bread orders with broadcasting.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters. orders has one row per café and one column per loaf.
"""

import numpy as np


def bill_lines(orders, prices, discounts):
    """orders x price x (1 - discount): prices go with the columns, discounts with the rows."""
    # TODO: turn the per-café discounts into a column before combining.
    raise NotImplementedError


def versus_average(orders):
    """Each order minus the average order of that loaf over all the cafés."""
    # TODO: the mean of each column broadcasts down the rows.
    raise NotImplementedError


def price_list(prices, quantities):
    """Row i holds the price of quantities[i] of each loaf."""
    # TODO: a column of quantities times a row of prices.
    raise NotImplementedError
