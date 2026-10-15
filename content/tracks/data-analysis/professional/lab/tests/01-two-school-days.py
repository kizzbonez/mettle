# The two school days from the instructions, through every function.
import numpy as np
import pandas as pd

FILES = ["data/readings-2026-03-02.csv", "data/readings-2026-03-03.csv"]
rooms = pd.read_csv("data/rooms.csv", dtype=str)

raw = load_readings(FILES)
assert isinstance(raw, pd.DataFrame), "load_readings returns a DataFrame"
assert list(raw.columns) == ["file", "line", "sensor", "time", "co2_ppm", "temp_c"], (
    "load_readings returns the columns file, line, sensor, time, co2_ppm, temp_c in that order"
)
assert len(raw) == 134, "load_readings keeps every line of both files"
check_frame(
    raw.iloc[[0, 1, 67, 68]],
    pd.DataFrame(
        {
            "file": ["readings-2026-03-02.csv", "readings-2026-03-02.csv",
                     "readings-2026-03-02.csv", "readings-2026-03-03.csv"],
            "line": [2, 3, 69, 2],
            "sensor": ["AQ-01", " aq-02", "AQ-02", "AQ-01"],
            "time": ["2026-03-02 09:00", "2026-03-02 09:00", "2026-03-02 10:30", "2026-03-02 15:00"],
            "co2_ppm": ["572", "652", "830", "1104"],
            "temp_c": ["19.0", "19.2", "19.3", "20.8"],
        },
        index=[0, 1, 67, 68],
    ),
    "load_readings keeps values as text, names the file without its folder and numbers lines from 2",
)

clean, quarantine = validate(raw, rooms)
assert len(clean) == 122 and len(quarantine) == 12, "validate keeps 122 rows and quarantines 12"
check_frame(
    clean.head(3),
    pd.DataFrame(
        {
            "sensor": ["AQ-01", "AQ-01", "AQ-01"],
            "room": ["Room 1", "Room 1", "Room 1"],
            "time": pd.to_datetime(["2026-03-02 09:00", "2026-03-02 09:30", "2026-03-02 10:00"]),
            "co2_ppm": np.array([572, 957, 1196], dtype="int64"),
            "temp_c": [19.0, 19.9, 21.0],
        }
    ),
    "the first rows of clean: columns, dtypes and the sort by sensor then time",
)
check_frame(
    quarantine[["file", "line", "reason"]],
    pd.DataFrame(
        {
            "file": ["readings-2026-03-02.csv"] * 7 + ["readings-2026-03-03.csv"] * 5,
            "line": [17, 25, 33, 51, 57, 58, 69, 2, 9, 15, 31, 43],
            "reason": ["unknown sensor", "bad time", "bad co2", "bad co2", "duplicate", "bad temperature",
                       "duplicate", "duplicate", "bad time", "bad temperature", "bad co2", "unknown sensor"],
        }
    ),
    "the quarantined rows, in file order, each with the first rule it breaks",
)

daily = summarise(clean)
check_frame(
    daily,
    pd.DataFrame(
        {
            "date": pd.to_datetime(["2026-03-02"] * 5 + ["2026-03-03"] * 5),
            "room": ["Hall", "Music room", "Room 1", "Room 2", "Science lab"] * 2,
            "readings": np.array([12, 12, 12, 13, 12, 13, 12, 12, 12, 12], dtype="int64"),
            "mean_co2": [739.5, 1339.8, 1048.8, 1113.7, 1190.5, 794.3, 1139.1, 1086.3, 1050.2, 1361.7],
            "max_co2": np.array([918, 1866, 1465, 1537, 1683, 990, 1649, 1507, 1433, 1934], dtype="int64"),
            "high": np.array([0, 4, 0, 1, 4, 0, 2, 1, 0, 5], dtype="int64"),
            "mean_temp": [20.2, 20.5, 20.5, 20.4, 20.4, np.nan, 20.3, 20.4, 20.5, 20.4],
        }
    ),
    "the daily summary of the two school days",
)

expected_report = """Air quality report
Rows read: 134
Rows kept: 122 (91.0%)
Rows quarantined: 12
  bad co2: 3
  bad temperature: 2
  bad time: 2
  duplicate: 3
  unknown sensor: 2
Worst room each day:
  2026-03-02 Music room: max 1866 ppm, 4 of 12 readings high
  2026-03-03 Science lab: max 1934 ppm, 5 of 12 readings high
"""
text = report(clean, quarantine, daily)
assert isinstance(text, str), "report returns a string"
if text != expected_report:
    print("report returned:\n" + text)
assert text == expected_report, "report returns exactly the text of the example in the instructions"
