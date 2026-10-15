# read_scales on small exports: messy cells, rows out of order, the March clock change and winter time.
from pathlib import Path

import pandas as pd


def local(*utc_times):
    return pd.to_datetime(list(utc_times), utc=True).tz_convert("Europe/London")


Path("march.csv").write_text(
    "time_utc,H2,H1\n"
    "2026-03-28T23:30Z,30.1,ERR\n"
    "2026-03-28T17:30Z,30.4,25.0\n"
    "2026-03-29T05:30Z,,25.2\n"
    "2026-03-29T11:30Z,-,25.1\n"
    "2026-03-29T23:30Z,30.9,n/a\n",
    encoding="utf-8",
)
march = read_scales("march.csv")
expected = pd.DataFrame({
    "time": local("2026-03-28T17:30Z", "2026-03-29T05:30Z", "2026-03-29T11:30Z",
                  "2026-03-28T17:30Z", "2026-03-28T23:30Z", "2026-03-29T23:30Z"),
    "hive_id": ["H1", "H1", "H1", "H2", "H2", "H2"],
    "weight_kg": [25.0, 25.2, 25.1, 30.4, 30.1, 30.9],
})
check_frame(
    march,
    expected,
    "read_scales drops empty and non-numeric cells, converts UTC to local time across the clock change, "
    "sorts by hive_id then time and renumbers the rows",
)
assert str(march["time"].iloc[4]) == "2026-03-28 23:30:00+00:00", (
    "23:30 UTC on 28 March is still 23:30 local time: the clocks change on the 29th"
)

Path("winter.csv").write_text(
    "time_utc,H3,H4\n"
    "2026-01-15T12:00Z,22.5,\n"
    "2026-01-15T18:00Z,22.7,\n",
    encoding="utf-8",
)
winter = read_scales("winter.csv")
expected_winter = pd.DataFrame({
    "time": local("2026-01-15T12:00Z", "2026-01-15T18:00Z"),
    "hive_id": ["H3", "H3"],
    "weight_kg": [22.5, 22.7],
})
check_frame(
    winter,
    expected_winter,
    "a file with only numbers works too, a scale with no usable reading gives no rows, and winter time is UTC",
)

june = read_scales("data/scales-june.csv")
assert len(june) == 79, f"the June file has 79 usable readings (got {len(june)})"
assert june["hive_id"].tolist() == sorted(june["hive_id"]), "rows are sorted by hive_id even when the file's columns are not"
assert june["hive_id"].unique().tolist() == ["H01", "H03", "H05", "H07"], "every scale column of the file becomes a hive_id"
