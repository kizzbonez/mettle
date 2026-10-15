"""Car Park Charges: price every stay in the council's car parks, column by column.

charge_row is the rule as the old system wrote it, one row at a time. It gives the right
answers, but far too slowly for a year of stays. Write charges and stay_band with whole
columns (map, clip, np.ceil, np.minimum, np.where, np.select, where): no apply, no loops.
You may keep charge_row to compare answers on small frames, or delete it.
"""

import math

import numpy as np
import pandas as pd

FACTORS = {"station": 1.5, "high street": 1.0, "leisure centre": 0.5}


def charge_row(row):
    """The charge of one stay (a row with car_park, minutes and blue_badge)."""
    if row["blue_badge"]:
        return 0.0
    factor = FACTORS.get(row["car_park"])
    if factor is None:
        return math.nan
    minutes = row["minutes"]
    if minutes <= 30:
        base = 0.0
    elif minutes <= 120:
        base = 2.0
    elif minutes <= 240:
        base = 3.5
    else:
        base = min(3.5 + math.ceil((minutes - 240) / 60), 10.0)
    return round(base * factor, 2)


def charges(stays):
    """The charge of every stay, as a Series named charge with the stays' index."""
    raise NotImplementedError


def stay_band(stays):
    """quick, short, half day or long for every stay, as a Series named band."""
    raise NotImplementedError
