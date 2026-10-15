import gc
import os
import weakref

import numpy as np
import pandas as pd

rng = np.random.default_rng(21)
n = 100_000
path = "scans-chunks.csv"
store = rng.choice(["Ashford", "Bexley", "Carlton", "Dorking", "Epsom"], n)
store[-3_000:] = "Ludlow"
price = rng.integers(50, 30_000, n)
price[:40_000] = rng.integers(50, 500, 40_000)
pd.DataFrame({
    "scan_id": [f"C{number:07d}" for number in range(n)],
    "store": store,
    "till": rng.integers(1, 9, n),
    "price_pence": price,
    "quantity": rng.integers(1, 21, n),
    "scanned_at": "2026-05-03 11:00:00",
}).to_csv(path, index=False)

real_read_csv = pd.read_csv
whole = real_read_csv(path)
grouped = whole.assign(takings=whole["price_pence"] * whole["quantity"]).groupby("store")
expected = pd.DataFrame({"items": grouped["quantity"].sum(), "takings_pence": grouped["takings"].sum()})
expected["mean_price_pence"] = (expected["takings_pence"] / expected["items"]).round(2)
del whole, grouped


class WatchingReader:
    """Hands out the chunks of a real reader, recording their sizes and how many are still kept."""

    def __init__(self, reader):
        self.reader = reader
        self.sizes = []
        self.handed_out = []
        self.most_kept = 0

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.reader.close()

    def __iter__(self):
        return self

    def hand_out(self, chunk):
        gc.collect()
        kept = sum(ref() is not None for ref in self.handed_out)
        self.most_kept = max(self.most_kept, kept)
        self.handed_out.append(weakref.ref(chunk))
        self.sizes.append(len(chunk))
        return chunk

    def __next__(self):
        return self.hand_out(next(self.reader))

    def get_chunk(self, size=None):
        return self.hand_out(self.reader.get_chunk(size))

    def close(self):
        self.reader.close()


def totals_watched(chunksize):
    calls = []

    def watching_read_csv(*args, **kwargs):
        result = real_read_csv(*args, **kwargs)
        if kwargs.get("chunksize"):
            result = WatchingReader(result)
        calls.append((kwargs, result))
        return result

    pd.read_csv = watching_read_csv
    try:
        totals = store_totals(path, chunksize)
    finally:
        pd.read_csv = real_read_csv
    return totals, calls


totals, calls = totals_watched(15_000)
assert calls, "store_totals reads the file with pd.read_csv"
assert all(kwargs.get("chunksize") == 15_000 for kwargs, _ in calls), (
    "store_totals reads the file only in chunks of chunksize rows, never whole"
)
assert all(set(kwargs.get("usecols") or []) == {"store", "price_pence", "quantity"} for kwargs, _ in calls), (
    "store_totals reads only the three columns it needs"
)
sizes = [size for _, reader in calls for size in reader.sizes]
assert sizes == [15_000] * 6 + [10_000], "store_totals reads all 100,000 rows, 15,000 at a time"
assert max(reader.most_kept for _, reader in calls) <= 2, (
    "store_totals reduces each chunk before reading the next, instead of keeping the chunks"
)
check_frame(
    totals.set_axis(totals.index.astype("str")),
    expected,
    "store_totals sums items and takings over every chunk, including a store only in the last one, "
    "and computes the mean from the totals",
)

totals, calls = totals_watched(500_000)
assert [size for _, reader in calls for size in reader.sizes] == [100_000], (
    "a chunksize larger than the file gives one chunk"
)
check_frame(totals.set_axis(totals.index.astype("str")), expected, "store_totals gives the same totals in one chunk")
os.remove(path)
