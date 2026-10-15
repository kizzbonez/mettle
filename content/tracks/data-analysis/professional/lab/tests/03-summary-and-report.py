# summarise and report on hand-made clean frames: rounding, the 1500 ppm line, missing temperatures, ties.
import numpy as np
import pandas as pd

clean = pd.DataFrame(
    {
        "sensor": ["AQ-04", "AQ-03", "AQ-03", "AQ-04", "AQ-03", "AQ-01", "AQ-01", "AQ-01", "AQ-04"],
        "room": ["Music room", "Science lab", "Science lab", "Music room", "Science lab",
                 "Room 1", "Room 1", "Room 1", "Music room"],
        "time": pd.to_datetime(["2026-03-06 09:00", "2026-03-06 09:00", "2026-03-06 09:30", "2026-03-05 10:00",
                                "2026-03-05 09:00", "2026-03-05 09:00", "2026-03-05 09:30", "2026-03-05 10:00",
                                "2026-03-06 09:30"]),
        "co2_ppm": np.array([1499, 1500, 1720, 1100, 900, 700, 701, 701, 1720], dtype="int64"),
        "temp_c": [np.nan, 20.04, 20.0, 21.0, 19.0, 20.0, np.nan, 21.0, np.nan],
    }
)
daily = summarise(clean)
check_frame(
    daily,
    pd.DataFrame(
        {
            "date": pd.to_datetime(["2026-03-05", "2026-03-05", "2026-03-05", "2026-03-06", "2026-03-06"]),
            "room": ["Music room", "Room 1", "Science lab", "Music room", "Science lab"],
            "readings": np.array([1, 3, 1, 2, 2], dtype="int64"),
            "mean_co2": [1100.0, 700.7, 900.0, 1609.5, 1610.0],
            "max_co2": np.array([1100, 701, 900, 1720, 1720], dtype="int64"),
            "high": np.array([0, 0, 0, 1, 2], dtype="int64"),
            "mean_temp": [21.0, 20.5, 19.0, np.nan, 20.0],
        }
    ),
    "summarise: one row per day and room, sorted, with rounded means, 1500 ppm counted as high, "
    "and NaN when a room has no temperature that day",
)

empty_quarantine = pd.DataFrame(
    {column: pd.Series([], dtype="str") for column in ["file", "sensor", "time", "co2_ppm", "temp_c", "reason"]}
).assign(line=pd.Series([], dtype="int64"))[["file", "line", "sensor", "time", "co2_ppm", "temp_c", "reason"]]
text = report(clean, empty_quarantine, daily)
assert text == (
    "Air quality report\n"
    "Rows read: 9\n"
    "Rows kept: 9 (100.0%)\n"
    "Rows quarantined: 0\n"
    "Worst room each day:\n"
    "  2026-03-05 Music room: max 1100 ppm, 0 of 1 readings high\n"
    "  2026-03-06 Music room: max 1720 ppm, 1 of 2 readings high\n"
), "report with nothing quarantined has no reason lines, and a tie for the worst room goes to the first room by name"

quarantine = pd.DataFrame(
    {
        "file": ["x.csv"] * 4,
        "line": [2, 5, 7, 9],
        "sensor": ["AQ-01", "AQ-02", "AQ-01", "AQ-01"],
        "time": ["", "2026-03-05 09:00", "2026-03-05 09:00", "2026-03-05 09:00"],
        "co2_ppm": ["700", "n/a", "700", "700"],
        "temp_c": ["20.0", "20.0", "20.0", "99"],
        "reason": ["bad time", "bad co2", "duplicate", "bad temperature"],
    }
)
lines = report(clean.iloc[:2], quarantine, summarise(clean.iloc[:2])).splitlines()
assert lines[1:8] == [
    "Rows read: 6",
    "Rows kept: 2 (33.3%)",
    "Rows quarantined: 4",
    "  bad co2: 1",
    "  bad temperature: 1",
    "  bad time: 1",
    "  duplicate: 1",
], "report counts rows read, kept (with a one-decimal percentage) and quarantined, with reasons in alphabetical order"
assert lines[8:] == ["Worst room each day:", "  2026-03-06 Science lab: max 1500 ppm, 1 of 1 readings high"], (
    "report lists only the days that are in the summary"
)
