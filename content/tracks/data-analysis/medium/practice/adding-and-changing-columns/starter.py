"""Print Shop: price, tidy and correct the print shop's orders.

Every `raise NotImplementedError` marks code you still have to write.
Every function returns a NEW frame: never change `orders` itself.
"""

import numpy as np
import pandas as pd

CHANNELS = {"S": "shop", "W": "web", "E": "email"}


def add_totals(orders):
    """orders plus subtotal, rush_fee and total."""
    raise NotImplementedError


def tidy(orders):
    """src renamed to channel with its codes spelt out; note dropped."""
    raise NotImplementedError


def bulk_price(orders, min_copies, discount):
    """unit_price reduced by discount for orders of at least min_copies copies."""
    raise NotImplementedError


def correct_products(orders, corrections):
    """product codes listed in corrections replaced; the rest kept."""
    raise NotImplementedError
