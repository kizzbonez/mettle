import shutil

import numpy as np
import pandas as pd

rng = np.random.default_rng(14)
n = 5_000
crossings = pd.DataFrame({
    "route": rng.choice(["North", "Island", "Bay", "Harbour", "Point"], n),
    "departure": pd.Timestamp("2026-08-01 06:00") + pd.to_timedelta(rng.permutation(n) * 10, unit="min"),
    "passengers": rng.integers(0, 400, n),
    "cars": pd.array(np.where(rng.random(n) < 0.2, None, rng.integers(0, 60, n)), dtype="Int64"),
    "cancelled": rng.random(n) < 0.03,
}).astype({"departure": "datetime64[us]"})
crossings.loc[crossings.index[:5], ["route", "passengers"]] = ["Point", 300]
folder = "dataset-busy"
shutil.rmtree(folder, ignore_errors=True)
crossings.to_parquet(folder, partition_cols=["route"], index=False)

real_read_parquet = pd.read_parquet
calls = []


def recording_read_parquet(*args, **kwargs):
    calls.append(kwargs)
    return real_read_parquet(*args, **kwargs)


def expected(route, least):
    chosen = crossings[(crossings["route"] == route) & (crossings["passengers"] >= least)]
    return chosen[["departure", "passengers", "cars"]].sort_values("departure", ignore_index=True)


pd.read_parquet = recording_read_parquet
try:
    harbour = busy_crossings(folder, "Harbour", 350)
    point = busy_crossings(folder, "Point", 300)
    nobody = busy_crossings(folder, "Lighthouse", 0)
    empty = busy_crossings(folder, "North", 1_000)
finally:
    pd.read_parquet = real_read_parquet

assert calls, "busy_crossings reads the dataset with pd.read_parquet"
assert all(set(kwargs.get("columns") or []) == {"departure", "passengers", "cars"} for kwargs in calls), (
    "busy_crossings passes columns naming only departure, passengers and cars"
)
assert all("route" in str(kwargs.get("filters")) and "passengers" in str(kwargs.get("filters")) for kwargs in calls), (
    "busy_crossings passes filters on the route and on the passengers"
)
check_frame(
    harbour,
    expected("Harbour", 350),
    "busy_crossings returns one route's busy crossings, three columns with their dtypes, sorted by departure, "
    "with the index 0 to n-1",
)
check_frame(point, expected("Point", 300), "a crossing with exactly min_passengers passengers is busy")
for result in [nobody, empty]:
    assert isinstance(result, pd.DataFrame) and len(result) == 0, "no matching crossing gives a frame without rows"
    assert list(result.columns) == ["departure", "passengers", "cars"], (
        "no matching crossing still gives the three columns"
    )
shutil.rmtree(folder)
