import os

import numpy as np
import pandas as pd

rng = np.random.default_rng(12)
n = 60_000
path = "scans-read-less.csv"
pd.DataFrame({
    "scan_id": [f"R{number:07d}" for number in range(n)],
    "store": rng.choice(["Kendal", "Ludlow", "Hythe", "Epsom"], n),
    "till": rng.integers(1, 9, n),
    "price_pence": rng.integers(50, 90_000, n),
    "quantity": rng.integers(-2, 21, n),
    "scanned_at": "2026-05-02 10:00:00",
}).to_csv(path, index=False)

real_read_csv = pd.read_csv
calls = []


def recording_read_csv(*args, **kwargs):
    calls.append(kwargs)
    return real_read_csv(*args, **kwargs)


pd.read_csv = recording_read_csv
try:
    takings = read_takings(path)
finally:
    pd.read_csv = real_read_csv

wanted = {"store", "price_pence", "quantity"}
assert calls, "read_takings reads the file with pd.read_csv"
assert all(set(kwargs.get("usecols") or []) == wanted for kwargs in calls), (
    "read_takings passes usecols naming only store, price_pence and quantity"
)
assert all(isinstance(kwargs.get("dtype"), dict) and wanted <= set(kwargs["dtype"]) for kwargs in calls), (
    "read_takings passes dtype with the types of the three columns, so they are chosen while reading"
)
check_frame(
    takings,
    real_read_csv(path, usecols=["store", "price_pence", "quantity"]).astype(
        {"store": "category", "price_pence": "int32", "quantity": "int8"}
    ),
    "read_takings returns the three columns of 60,000 scans with the stated types and every value",
)
os.remove(path)
