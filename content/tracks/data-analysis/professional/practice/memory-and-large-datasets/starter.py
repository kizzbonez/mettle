"""Till Scans: shrink and summarise the garden centres' till scans without running out of memory.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import pandas as pd

TIME_FORMAT = "%Y-%m-%d %H:%M:%S"
TAKINGS_COLUMNS = ["store", "price_pence", "quantity"]


def shrink(scans):
    """A copy of SCANS with smaller column types and the same values."""
    raise NotImplementedError


def read_takings(path):
    """Only store, price_pence and quantity, in small types chosen while reading."""
    # Pass usecols and dtype to pd.read_csv, so the wide version never exists.
    raise NotImplementedError


def store_totals(path, chunksize):
    """Items, takings and mean price per store, reading CHUNKSIZE rows at a time."""
    # Keep two small running Series (items and takings per store) and add each chunk's sums
    # to them with .add(..., fill_value=0); divide once, at the end.
    raise NotImplementedError
