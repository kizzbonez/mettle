import os

import pandas as pd
import pyarrow.parquet as pq

crossings = pd.DataFrame({
    "route": ["North", "Island", "North", "Bay", "Island", "North"],
    "departure": pd.to_datetime(
        ["2026-07-06 11:00", "2026-07-06 07:30", "2026-07-06 07:00", "2026-07-06 08:15", "2026-07-06 10:30",
         "2026-07-06 09:00"]
    ),
    "passengers": [288, 48, 212, 96, 61, 305],
    "cars": pd.array([38, None, 40, 12, None, 55], dtype="Int64"),
    "cancelled": [False, False, False, True, False, False],
})

save_week(crossings, "week-27.parquet")
assert os.path.isfile("week-27.parquet"), "save_week writes the file it is given"
assert pq.read_schema("week-27.parquet").names == list(crossings.columns), (
    "the file save_week writes holds the crossings' columns and no index"
)
metadata = pq.ParquetFile("week-27.parquet").metadata.row_group(0)
assert all(metadata.column(i).compression == "ZSTD" for i in range(metadata.num_columns)), (
    "save_week compresses every column with zstd"
)
check_frame(pd.read_parquet("week-27.parquet"), crossings, "the example comes back from save_week's file with every dtype")

save_by_route(crossings, "ferries")
assert sorted(os.listdir("ferries")) == ["route=Bay", "route=Island", "route=North"], (
    "save_by_route makes one route=NAME folder per route"
)
check_frame(
    busy_crossings("ferries", "North", 250),
    pd.DataFrame({
        "departure": pd.to_datetime(["2026-07-06 09:00", "2026-07-06 11:00"]),
        "passengers": [305, 288],
        "cars": pd.array([55, 38], dtype="Int64"),
    }),
    "busy_crossings finds the example's busy North crossings, sorted by departure",
)
