from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow.parquet as pq

rng = np.random.default_rng(9)
n = 600
crossings = pd.DataFrame({
    "route": rng.choice(["North", "Island", "Bay", "Harbour"], n),
    "departure": pd.Timestamp("2026-07-20 06:00") + pd.to_timedelta(rng.integers(0, 7 * 24 * 60, n), unit="min"),
    "passengers": rng.integers(0, 400, n),
    "cars": pd.array(np.where(rng.random(n) < 0.2, None, rng.integers(0, 60, n)), dtype="Int64"),
    "cancelled": rng.random(n) < 0.05,
}).astype({"departure": "datetime64[us]"})
sailed = crossings[~crossings["cancelled"]]
folder = Path("by-route")


def read_back(folder):
    """The dataset as pandas reads it, with the columns in the original order and a stable row order."""
    back = pd.read_parquet(folder)
    back = back.astype({"route": "str"})[list(crossings.columns)]
    return back.sort_values(["route", "departure", "passengers"], ignore_index=True, kind="stable")


def expected(frame):
    return frame.sort_values(["route", "departure", "passengers"], ignore_index=True, kind="stable")


save_by_route(sailed, str(folder))
assert sorted(path.name for path in folder.iterdir()) == ["route=Bay", "route=Harbour", "route=Island", "route=North"], (
    "save_by_route creates the folder with one route=NAME folder per route and nothing else"
)
for part in folder.iterdir():
    files = list(part.glob("*.parquet"))
    assert files, "every route folder holds a Parquet file"
    assert all("__index_level_0__" not in pq.read_schema(file).names for file in files), (
        "save_by_route leaves out an index with gaps"
    )
    assert all("route" not in pq.read_schema(file).names for file in files), (
        "the route lives in the folder names, not inside the files"
    )
check_frame(read_back(folder), expected(sailed), "reading the folder back gives every crossing written")

island = sailed[sailed["route"].isin(["Island", "Bay"])]
save_by_route(island, str(folder))
assert sorted(path.name for path in folder.iterdir()) == ["route=Bay", "route=Island"], (
    "saving into an existing folder replaces it: the routes of the earlier save are gone"
)
check_frame(
    read_back(folder),
    expected(island),
    "saving into an existing folder replaces it: only the new crossings are read back",
)
