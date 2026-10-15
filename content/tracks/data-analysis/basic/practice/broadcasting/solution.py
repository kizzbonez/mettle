"""Bakery Rounds: price the cafés' bread orders with broadcasting."""

import numpy as np


def bill_lines(orders, prices, discounts):
    """orders x price x (1 - discount): prices go with the columns, discounts with the rows."""
    return orders * prices * (1 - discounts[:, np.newaxis])


def versus_average(orders):
    """Each order minus the average order of that loaf over all the cafés."""
    return orders - orders.mean(axis=0)


def price_list(prices, quantities):
    """Row i holds the price of quantities[i] of each loaf."""
    return quantities[:, np.newaxis] * prices
