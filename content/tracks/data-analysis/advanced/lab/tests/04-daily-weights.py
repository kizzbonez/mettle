# daily_weights: local days, a row for every date, one column per scale, rounded means.
from pathlib import Path

import numpy as np
import pandas as pd

nan = np.nan
may = daily_weights(read_scales("data/scales-may.csv"))
dates = pd.date_range("2026-05-01", "2026-05-15", freq="D", tz="Europe/London", name="date")
expected = pd.DataFrame({
    "H01": [34.47, 35.58, 36.45, 37.33, 38.22, 39.12, 40.05, 40.9, 41.8, nan, 43.6, 44.62, 45.55, 46.35, 47.4],
    "H02": [31.2, 32.0, 32.6, 33.28, 34.08, 34.72, 35.42, 36.08, 36.83, nan, 38.25, 38.88, 39.65, 40.33, 41.0],
    "H03": [28.87, 28.72, 28.42, 28.25, 27.88, 27.62, 27.5, 27.15, 26.95, nan, 26.42, 26.1, 26.02, 25.72, 25.7],
    "H04": [41.27, 41.5, 41.72, 42.05, 42.18, 42.25, 42.55, 43.58, 44.72, nan, 46.98, 48.02, 49.08, 50.18, 51.5],
    "H05": [38.63, 38.83, 39.15, 39.2, 39.48, 39.37, 39.62, 39.78, 40.0, nan, 40.17, 40.38, 40.55, 40.65, 41.1],
    "H06": [36.4, 37.0, 37.5, 38.08, 38.7, 39.2, 39.78, 40.2, 37.62, nan, 38.7, 39.22, 39.85, 40.3, 41.1],
    "H07": [32.97, 33.33, 33.75, 34.05, nan, 34.83, 35.12, 35.48, 35.75, nan, 36.55, 36.88, 37.22, 37.62, 37.9],
    "H09": [19.97, 20.05, 19.95, 20.23, 20.0, 20.1, 20.05, 20.08, 19.98, nan, 20.05, 19.98, 20.08, 19.98, 20.1],
}, index=dates)
expected.columns.name = "hive_id"
check_frame(
    may,
    expected,
    "the May daily means: one row per local date including the empty 10 May, one column per scale, "
    "missing where a scale sent nothing that day",
    check_freq=False,
    atol=0.011,
)
values = may.to_numpy()
assert np.allclose(values, np.round(values, 2), atol=1e-9, equal_nan=True), "daily weights are rounded to 2 decimals"

june = daily_weights(read_scales("data/scales-june.csv"))
assert list(june.columns) == ["H01", "H03", "H05", "H07"], (
    f"the columns are the scales of the file, sorted (got {list(june.columns)})"
)
assert len(june) == 6 and str(june.index[-1].date()) == "2026-06-06", (
    "the last June reading, at 23:30 UTC on 5 June, falls on 6 June local time"
)

Path("march.csv").write_text(
    "time_utc,H2,H1\n"
    "2026-03-28T23:30Z,30.1,ERR\n"
    "2026-03-28T17:30Z,30.4,25.0\n"
    "2026-03-29T05:30Z,,25.2\n"
    "2026-03-29T11:30Z,-,25.1\n"
    "2026-03-29T23:30Z,30.9,n/a\n",
    encoding="utf-8",
)
march = daily_weights(read_scales("march.csv"))
expected_march = pd.DataFrame(
    {"H1": [25.0, 25.15, nan], "H2": [30.25, nan, 30.9]},
    index=pd.date_range("2026-03-28", periods=3, freq="D", tz="Europe/London", name="date"),
)
expected_march.columns.name = "hive_id"
check_frame(
    march,
    expected_march,
    "days are local calendar days across the clock change, each indexed by its local midnight",
    check_freq=False,
    atol=0.011,
)
