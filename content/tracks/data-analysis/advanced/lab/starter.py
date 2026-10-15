"""Hive Scale Season Report: join the scale gateway's export to the hive register and report the nectar flow.

Every `raise NotImplementedError` below marks code you still have to write.
Keep every function name and its parameters: the tests use them.
You may add helper functions.
"""

import numpy as np
import pandas as pd

LOCAL_ZONE = "Europe/London"
BANDS = ["losing", "steady", "flow", "strong"]


def read_scales(path):
    """Return one row per usable reading: time (local), hive_id and weight_kg.

    TODO 1: melt the wide export, turn the weights into numbers (dropping unusable ones),
    convert the UTC times to LOCAL_ZONE, sort by hive_id then time, and renumber the rows.
    """
    raise NotImplementedError


def read_hives(hives_path, apiaries_path):
    """Return the hive register joined to its apiaries, one row per hive.

    TODO 2: clean hive_id, merge with the apiaries (validated), keep hive_id, colony,
    apiary and site, sorted by hive_id.
    """
    raise NotImplementedError


def unknown_scales(readings, hives):
    """Count the readings of every scale that is not in the hive register.

    TODO 3: an anti join, then a count per hive_id, named "readings".
    """
    raise NotImplementedError


def daily_weights(readings):
    """Mean weight of each hive on each local day, one row per date, one column per hive.

    TODO 4: reshape to wide with one row per local date (every date, even an empty one),
    name the index "date", round to 2 decimals.
    """
    raise NotImplementedError


def hive_summary(daily, hives):
    """Gain, best three days, rank and band of every registered hive that has daily weights.

    TODO 5: gain_kg, best_3_days_kg, rank (ties share the better rank) and band (pd.cut),
    joined to colony and apiary, sorted by rank then hive_id.
    """
    raise NotImplementedError
