"""Pet Weigh-ins: check the front desk's weigh-in export before the nurses use it.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import numpy as np
import pandas as pd

# Read the export with pd.read_csv("data/visits.csv", dtype=TEXT): the tests do the same.
TEXT = {"visit_id": "str", "pet": "str", "species": "str", "date": "str", "weight_kg": "float64"}
SPECIES = ["cat", "dog", "rabbit"]
DATE_FORMAT = "%Y-%m-%d"


def find_reasons(visits):
    """The first rule each row breaks, or "" for a good row, as a Series named reason."""
    # One boolean Series per rule, kept in a dict from reason to mask in the order of the
    # instructions; np.select then picks the first reason that is True for each row.
    raise NotImplementedError


def split_visits(visits):
    """(clean, quarantine): the good rows cleaned, and the bad rows as given with their reason."""
    raise NotImplementedError


def reason_counts(quarantine):
    """How many quarantined rows fell to each reason, reasons in alphabetical order."""
    raise NotImplementedError
