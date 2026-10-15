# Every validation rule, its boundaries, the order of the rules and how duplicates are found.
from pathlib import Path

import numpy as np
import pandas as pd

rooms = pd.read_csv("data/rooms.csv", dtype=str)
Path("batch").mkdir(exist_ok=True)
Path("batch/odd-day.csv").write_text(
    "sensor,time,co2_ppm,temp_c\n"
    " aq-03 , 2026-03-05 09:00 , 640 , 20.5 \n"   # 2: valid once spaces are removed
    "AQ-09,2026-03-05 09:00,n/a,99\n"              # 3: unknown sensor comes first
    "AQ-01,2026-03-05 09:00,n/a,hot\n"             # 4: bad co2 comes before bad temperature
    "AQ-01,2026-02-30 09:00,700,20.0\n"            # 5: no such date
    "AQ-01,05/03/2026 09:30,700,20.0\n"            # 6: wrong form
    "AQ-01,,700,20.0\n"                            # 7: empty time
    "AQ-01,2026-03-05 09:30,300,0\n"               # 8: lowest allowed values
    "AQ-01,2026-03-05 10:00,5000,40\n"             # 9: highest allowed values
    "AQ-01,2026-03-05 10:30,5001,20.0\n"           # 10: too high
    "AQ-01,2026-03-05 11:00,299,20.0\n"            # 11: too low
    "AQ-01,2026-03-05 11:30,850.5,20.0\n"          # 12: not whole
    "AQ-01,2026-03-05 12:00,850.0,\n"              # 13: whole, no temperature
    "AQ-01,2026-03-05 12:30,700,40.1\n"            # 14: too warm
    "AQ-01,2026-03-05 13:00,700,-0.5\n"            # 15: too cold
    'AQ-01,2026-03-05 13:30,700,"21,5"\n'          # 16: decimal comma
    "AQ-02,2026-03-05 09:00,9000,20.0\n"           # 17: bad co2
    "AQ-02,2026-03-05 09:00,640,20.0\n"            # 18: valid: the earlier row with this key was bad
    "aq-02,2026-03-05 09:00,650,20.1\n"            # 19: duplicate of line 18 once cleaned
    "AQ-02,2026-03-05 09:00,9000,20.0\n"           # 20: bad co2, not duplicate
    "AQ-03,2026-03-05 08:30,610,19.5\n"            # 21: valid, earlier than line 2
    "AQ-01,2026-03-05 25:00,n/a,hot\n",            # 22: bad time comes before bad co2 and temperature
    encoding="utf-8",
)

raw = load_readings(["batch/odd-day.csv"])
assert list(raw.columns) == ["file", "line", "sensor", "time", "co2_ppm", "temp_c"], (
    "load_readings returns the six columns in the stated order"
)
assert (raw["file"] == "odd-day.csv").all(), "file holds the file name without its folder"
assert raw["line"].tolist() == list(range(2, 23)), "line counts the header as line 1"
assert str(raw["line"].dtype) == "int64", "line is int64"
assert raw.loc[0, "sensor"] == " aq-03 " and raw.loc[11, "temp_c"] == "", (
    "load_readings keeps values exactly as written, with an empty field as the empty string"
)

clean, quarantine = validate(raw, rooms)
assert len(quarantine) == 15, "validate quarantines 15 of the 21 rows"
assert quarantine["line"].tolist() == [3, 4, 5, 6, 7, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22], (
    "quarantine holds the bad rows in the order of the file"
)
check_frame(
    quarantine.iloc[:12],
    pd.DataFrame(
        {
            "file": ["odd-day.csv"] * 12,
            "line": [3, 4, 5, 6, 7, 10, 11, 12, 14, 15, 16, 17],
            "sensor": ["AQ-09", "AQ-01", "AQ-01", "AQ-01", "AQ-01", "AQ-01",
                       "AQ-01", "AQ-01", "AQ-01", "AQ-01", "AQ-01", "AQ-02"],
            "time": ["2026-03-05 09:00", "2026-03-05 09:00", "2026-02-30 09:00", "05/03/2026 09:30", "",
                     "2026-03-05 10:30", "2026-03-05 11:00", "2026-03-05 11:30", "2026-03-05 12:30",
                     "2026-03-05 13:00", "2026-03-05 13:30", "2026-03-05 09:00"],
            "co2_ppm": ["n/a", "n/a", "700", "700", "700", "5001", "299", "850.5", "700", "700", "700", "9000"],
            "temp_c": ["99", "hot", "20.0", "20.0", "20.0", "20.0", "20.0", "20.0", "40.1", "-0.5", "21,5", "20.0"],
            "reason": ["unknown sensor", "bad co2", "bad time", "bad time", "bad time", "bad co2", "bad co2",
                       "bad co2", "bad temperature", "bad temperature", "bad temperature", "bad co2"],
        }
    ),
    "quarantined rows keep their values as read, with the first rule each breaks as the reason",
)
check_frame(
    quarantine.iloc[12:].reset_index(drop=True),
    pd.DataFrame(
        {
            "file": ["odd-day.csv"] * 3,
            "line": [19, 20, 22],
            "sensor": ["aq-02", "AQ-02", "AQ-01"],
            "time": ["2026-03-05 09:00", "2026-03-05 09:00", "2026-03-05 25:00"],
            "co2_ppm": ["650", "9000", "n/a"],
            "temp_c": ["20.1", "20.0", "hot"],
            "reason": ["duplicate", "bad co2", "bad time"],
        }
    ),
    "a row is a duplicate only of an earlier row that passed the other rules, a bad row is never a duplicate, "
    "and a bad time is reported before a bad co2 or temperature",
)
assert list(quarantine.index) == list(range(15)), "quarantine has the index 0 to n-1"

check_frame(
    clean,
    pd.DataFrame(
        {
            "sensor": ["AQ-01", "AQ-01", "AQ-01", "AQ-02", "AQ-03", "AQ-03"],
            "room": ["Room 1", "Room 1", "Room 1", "Room 2", "Science lab", "Science lab"],
            "time": pd.to_datetime(["2026-03-05 09:30", "2026-03-05 10:00", "2026-03-05 12:00",
                                    "2026-03-05 09:00", "2026-03-05 08:30", "2026-03-05 09:00"]),
            "co2_ppm": np.array([300, 5000, 850, 640, 610, 640], dtype="int64"),
            "temp_c": [0.0, 40.0, np.nan, 20.0, 19.5, 20.5],
        }
    ),
    "clean holds the valid rows, cleaned and typed, sorted by sensor then time, with an empty temperature as NaN",
)
