"""Ferry Log: store the ferry company's crossings in Parquet and read back only what is needed."""

import shutil

import pandas as pd

BUSY_COLUMNS = ["departure", "passengers", "cars"]


def save_week(crossings, path):
    """Write CROSSINGS to one Parquet file, zstd-compressed, without the index."""
    crossings.to_parquet(path, compression="zstd", index=False)


def save_by_route(crossings, folder):
    """Write CROSSINGS as a dataset with one route=NAME folder per route, replacing FOLDER."""
    shutil.rmtree(folder, ignore_errors=True)
    crossings.to_parquet(folder, partition_cols=["route"], index=False)


def busy_crossings(folder, route, min_passengers):
    """The crossings of ROUTE with at least MIN_PASSENGERS, reading only what is needed."""
    busy = pd.read_parquet(
        folder,
        columns=BUSY_COLUMNS,
        filters=[("route", "==", route), ("passengers", ">=", min_passengers)],
    )
    return busy.sort_values("departure", ignore_index=True)
