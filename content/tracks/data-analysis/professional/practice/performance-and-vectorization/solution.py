"""Parking Fees: re-price every ticket of the car parks when a tariff changes."""

import numpy as np
import pandas as pd

FREE_MINUTES = 20
NIGHT_FEE = 4.00
DAY_CAP = 15.00


def is_night(entry_hour):
    """True for entries from 22:00 to 05:59."""
    return (entry_hour >= 22) | (entry_hour < 6)


def hourly_rates(stays, tariffs):
    """The per_hour rate of each stay's car park, NaN for a car park without a tariff."""
    rate_by_park = tariffs.set_index("car_park")["per_hour"]
    return stays["car_park"].map(rate_by_park).rename("per_hour")


def fees(stays, tariffs):
    """The fee of every stay, by the rules in the instructions, rounded to 2 decimals."""
    hours = np.ceil(stays["minutes"] / 60)
    day_fee = (hours * hourly_rates(stays, tariffs)).clip(upper=DAY_CAP)
    fee = np.select(
        [stays["minutes"] <= FREE_MINUTES, is_night(stays["entry_hour"])],
        [0.0, NIGHT_FEE],
        default=day_fee,
    )
    return pd.Series(fee, index=stays.index, name="fee").round(2)
