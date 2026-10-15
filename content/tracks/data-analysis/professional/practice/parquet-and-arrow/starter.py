"""Ferry Log: store the ferry company's crossings in Parquet and read back only what is needed.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import shutil

import pandas as pd

BUSY_COLUMNS = ["departure", "passengers", "cars"]


def save_week(crossings, path):
    """Write CROSSINGS to one Parquet file, zstd-compressed, without the index."""
    raise NotImplementedError


def save_by_route(crossings, folder):
    """Write CROSSINGS as a dataset with one route=NAME folder per route, replacing FOLDER."""
    # Writing into an existing dataset folder adds files beside the old ones: remove it first.
    raise NotImplementedError


def busy_crossings(folder, route, min_passengers):
    """The crossings of ROUTE with at least MIN_PASSENGERS, reading only what is needed."""
    # Let pd.read_parquet do the selecting with columns= and filters=.
    raise NotImplementedError
