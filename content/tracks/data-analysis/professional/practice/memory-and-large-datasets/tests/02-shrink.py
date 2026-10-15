import io

import numpy as np
import pandas as pd

rng = np.random.default_rng(4)
n = 200_000
stores = ["Ashford", "Bexley", "Carlton", "Dorking", "Epsom", "Farnham", "Guildford", "Hythe", "Ilford", "Jarrow",
          "Kendal", "Ludlow"]
scans = pd.DataFrame({
    "scan_id": [f"S{number:08d}" for number in range(3_000_000, 3_000_000 + n)],
    "store": rng.choice(stores, n),
    "till": rng.integers(1, 9, n),
    "price_pence": rng.integers(50, 25_000, n),
    "quantity": rng.integers(1, 21, n),
    "scanned_at": (
        pd.Timestamp("2026-04-01 08:00") + pd.to_timedelta(rng.integers(0, 30 * 86400, n), unit="s")
    ).strftime("%Y-%m-%d %H:%M:%S"),
})
before = scans.copy()

small = shrink(scans)
assert isinstance(small, pd.DataFrame), "shrink returns a DataFrame"
assert small.dtypes.astype(str).to_dict() == {
    "scan_id": "str",
    "store": "category",
    "till": "int8",
    "price_pence": "int16",
    "quantity": "int8",
    "scanned_at": "datetime64[us]",
}, "shrink gives 200,000 scans the stated types, columns in the same order"
assert small.memory_usage(deep=True).sum() < 6_300_000, "shrink brings 200,000 scans below 6.3 MB"
check_frame(
    small.astype({"store": "str", "till": "int64", "price_pence": "int64", "quantity": "int64"}).assign(
        scanned_at=small["scanned_at"].dt.strftime("%Y-%m-%d %H:%M:%S")
    ),
    scans,
    "shrink keeps every value of 200,000 scans",
)
check_frame(scans, before, "shrink does not change the frame it is given")

odd = pd.read_csv(io.StringIO(
    "scan_id,store,till,price_pence,quantity,scanned_at\n"
    "S1,Hythe,1,40000,1,2026-04-30 17:59:59\n"
    "S2,Hythe,1,120,-3,2026-04-30 18:00:00\n"
))
small = shrink(odd)
assert small.dtypes.astype(str).to_dict() == {
    "scan_id": "str",
    "store": "category",
    "till": "int8",
    "price_pence": "int32",
    "quantity": "int8",
    "scanned_at": "datetime64[us]",
}, "shrink picks the smallest signed type that holds each column: a price over 32,767 and a refund"
assert small["price_pence"].tolist() == [40000, 120] and small["quantity"].tolist() == [1, -3], (
    "shrink keeps a large price and a negative quantity exactly"
)
