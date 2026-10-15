"""Till Scans: shrink and summarise the garden centres' till scans without running out of memory."""

import pandas as pd

TIME_FORMAT = "%Y-%m-%d %H:%M:%S"
TAKINGS_COLUMNS = ["store", "price_pence", "quantity"]


def shrink(scans):
    """A copy of SCANS with smaller column types and the same values."""
    return scans.assign(
        store=scans["store"].astype("category"),
        till=pd.to_numeric(scans["till"], downcast="integer"),
        price_pence=pd.to_numeric(scans["price_pence"], downcast="integer"),
        quantity=pd.to_numeric(scans["quantity"], downcast="integer"),
        scanned_at=pd.to_datetime(scans["scanned_at"], format=TIME_FORMAT),
    )


def read_takings(path):
    """Only store, price_pence and quantity, in small types chosen while reading."""
    return pd.read_csv(
        path,
        usecols=TAKINGS_COLUMNS,
        dtype={"store": "category", "price_pence": "int32", "quantity": "int8"},
    )


def store_totals(path, chunksize):
    """Items, takings and mean price per store, reading CHUNKSIZE rows at a time."""
    items = pd.Series(dtype="int64")
    takings = pd.Series(dtype="int64")
    with pd.read_csv(path, usecols=TAKINGS_COLUMNS, chunksize=chunksize) as reader:
        for chunk in reader:
            by_store = chunk.assign(takings=chunk["price_pence"] * chunk["quantity"]).groupby("store")
            items = items.add(by_store["quantity"].sum(), fill_value=0)
            takings = takings.add(by_store["takings"].sum(), fill_value=0)
    totals = pd.DataFrame({"items": items, "takings_pence": takings}).astype("int64")
    totals["mean_price_pence"] = (totals["takings_pence"] / totals["items"]).round(2)
    return totals.rename_axis("store").sort_index()
