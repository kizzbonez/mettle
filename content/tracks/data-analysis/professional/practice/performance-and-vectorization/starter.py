"""Parking Fees: re-price every ticket of the car parks when a tariff changes.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import numpy as np
import pandas as pd

FREE_MINUTES = 20
NIGHT_FEE = 4.00
DAY_CAP = 15.00


def hourly_rates(stays, tariffs):
    """The per_hour rate of each stay's car park, NaN for a car park without a tariff."""
    # Look the rates up through a Series indexed by car_park, not by scanning tariffs once per stay.
    raise NotImplementedError


def fees(stays, tariffs):
    """The fee of every stay, by the rules in the instructions, rounded to 2 decimals."""
    # Work on whole columns: no loop over the rows, no apply(axis=1).
    raise NotImplementedError
