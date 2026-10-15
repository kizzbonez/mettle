import numpy as np
import pandas as pd
import pyarrow.parquet as pq

rng = np.random.default_rng(5)
n = 2_000
week = pd.DataFrame({
    "route": rng.choice(["North", "Island", "Bay", "Harbour"], n),
    "departure": pd.Timestamp("2026-07-13 06:00") + pd.to_timedelta(rng.integers(0, 7 * 24 * 60, n), unit="min"),
    "passengers": rng.integers(0, 400, n),
    "cars": pd.array(np.where(rng.random(n) < 0.2, None, rng.integers(0, 60, n)), dtype="Int64"),
    "cancelled": rng.random(n) < 0.03,
}).astype({"departure": "datetime64[us]"})
sailed = week[~week["cancelled"]]
before = sailed.copy()

save_week(sailed, "week-28.parquet")
names = pq.read_schema("week-28.parquet").names
assert "__index_level_0__" not in names and names == list(sailed.columns), (
    "save_week leaves out an index with gaps instead of storing it as a column"
)
metadata = pq.ParquetFile("week-28.parquet").metadata
assert all(
    metadata.row_group(group).column(i).compression == "ZSTD"
    for group in range(metadata.num_row_groups)
    for i in range(metadata.row_group(group).num_columns)
), "save_week compresses every column with zstd"
check_frame(
    pd.read_parquet("week-28.parquet"),
    sailed.reset_index(drop=True),
    "a week of crossings comes back with every value and dtype, the missing car counts included, and the index 0 to n-1",
)
check_frame(sailed, before, "save_week does not change the frame it is given")

save_week(sailed.head(3), "week-28.parquet")
check_frame(
    pd.read_parquet("week-28.parquet"),
    sailed.head(3).reset_index(drop=True),
    "saving again to the same file replaces what was there",
)
