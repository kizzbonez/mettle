"""Giant Vegetable Class: places, weight bands and suspicious weights at the village show."""

import numpy as np
import pandas as pd

BANDS = ["small", "medium", "large", "giant"]


def places(entries):
    """Each entry's place within its vegetable: heaviest 1, ties share it, no gaps."""
    place = entries.groupby("vegetable")["kg"].rank(ascending=False, method="dense")
    ranked = entries.assign(place=place.astype("int64"))
    return ranked.sort_values(["vegetable", "place", "grower"]).reset_index(drop=True)


def band_shares(entries):
    """The share of each vegetable's entries in each weight band; every band is a column."""
    band = pd.cut(entries["kg"], bins=[0, 5, 20, 100, np.inf], right=False, labels=BANDS)
    counts = entries.groupby(["vegetable", band], observed=False).size()
    shares = counts / counts.groupby(level="vegetable").transform("sum")
    return shares.unstack().round(3)


def outlier_report(kg):
    """The z-score of each weight and whether the 1.5 x IQR rule flags it."""
    q1, q3 = kg.quantile([0.25, 0.75])
    iqr = q3 - q1
    return pd.DataFrame(
        {
            "z": ((kg - kg.mean()) / kg.std()).round(2),
            "iqr_outlier": (kg < q1 - 1.5 * iqr) | (kg > q3 + 1.5 * iqr),
        }
    )
