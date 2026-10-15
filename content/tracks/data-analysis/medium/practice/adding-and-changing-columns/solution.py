"""Print Shop: price, tidy and correct the print shop's orders."""

import numpy as np
import pandas as pd

CHANNELS = {"S": "shop", "W": "web", "E": "email"}


def add_totals(orders):
    """orders plus subtotal, rush_fee and total."""
    return orders.assign(
        subtotal=pd.col("copies") * pd.col("unit_price"),
        rush_fee=np.where(orders["rush"], 15.0, 0.0),
        total=(pd.col("subtotal") + pd.col("rush_fee")).round(2),
    )


def tidy(orders):
    """src renamed to channel with its codes spelt out; note dropped."""
    renamed = orders.rename(columns={"src": "channel"}).drop(columns=["note"])
    return renamed.assign(channel=pd.col("channel").map(CHANNELS))


def bulk_price(orders, min_copies, discount):
    """unit_price reduced by discount for orders of at least min_copies copies."""
    bulk = orders["copies"] >= min_copies
    discounted = (orders["unit_price"] * (1 - discount)).round(2)
    return orders.assign(unit_price=orders["unit_price"].mask(bulk, discounted))


def correct_products(orders, corrections):
    """product codes listed in corrections replaced; the rest kept."""
    return orders.assign(product=orders["product"].replace(corrections))
