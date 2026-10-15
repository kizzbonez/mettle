"""Car Park Charges: price every stay in the council's car parks, column by column."""

import numpy as np
import pandas as pd

FACTORS = {"station": 1.5, "high street": 1.0, "leisure centre": 0.5}


def charges(stays):
    """The charge of every stay, as a Series named charge with the stays' index."""
    minutes = stays["minutes"]
    started_hours = np.ceil((minutes - 240).clip(lower=0) / 60)
    base = np.select(
        [minutes <= 30, minutes <= 120, minutes <= 240],
        [0.0, 2.0, 3.5],
        default=np.minimum(3.5 + started_hours, 10.0),
    )
    price = pd.Series(base, index=stays.index) * stays["car_park"].map(FACTORS)
    return price.where(~stays["blue_badge"], 0.0).round(2).rename("charge")


def stay_band(stays):
    """quick, short, half day or long for every stay, as a Series named band."""
    minutes = stays["minutes"]
    bands = np.select(
        [minutes <= 30, minutes <= 120, minutes <= 240],
        ["quick", "short", "half day"],
        default="long",
    )
    return pd.Series(bands, index=stays.index, name="band")
