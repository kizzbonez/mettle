# A file with another column order and an extra column, an empty file, and the order of the files.
import numpy as np
import pandas as pd

rooms = pd.read_csv("data/rooms.csv", dtype=str)

raw = load_readings(["data/readings-2026-03-04.csv"])
assert list(raw.columns) == ["file", "line", "sensor", "time", "co2_ppm", "temp_c"], (
    "load_readings returns the stated columns whatever their order in the file, and drops other columns"
)
assert len(raw) == 28 and raw.loc[7, "sensor"] == "aq-05 ", "load_readings reads every line of the file as written"

clean, quarantine = validate(raw, rooms)
assert quarantine["line"].tolist() == [10, 18], "the 2026-03-04 file has two quarantined rows"
assert quarantine["reason"].tolist() == ["bad co2", "bad co2"], "a co2 of 850.5 or an empty co2 is a bad co2"
assert len(clean) == 26 and "AQ-05" in set(clean["sensor"]), "a sensor id with spaces and lower case is cleaned"

daily = summarise(clean)
check_frame(
    daily,
    pd.DataFrame(
        {
            "date": pd.to_datetime(["2026-03-04"] * 4),
            "room": ["Hall", "Music room", "Room 2", "Science lab"],
            "readings": np.array([7, 7, 5, 7], dtype="int64"),
            "mean_co2": [688.7, 1092.3, 836.6, 1108.3],
            "max_co2": np.array([878, 1650, 1233, 1650], dtype="int64"),
            "high": np.array([0, 1, 0, 1], dtype="int64"),
            "mean_temp": [20.4, 20.2, 19.8, 20.2],
        }
    ),
    "the daily summary of the 2026-03-04 file, where a room with no readings does not appear",
)
assert report(clean, quarantine, daily).splitlines()[-1] == (
    "  2026-03-04 Music room: max 1650 ppm, 1 of 7 readings high"
), "when two rooms share the highest max_co2 of a day, the first by name is the worst room"

# Files are read in the order given, so the reading sent twice is kept from the file read first.
FILES = ["data/readings-2026-03-03.csv", "data/readings-2026-03-02.csv"]
clean, quarantine = validate(load_readings(FILES), rooms)
duplicates = quarantine[quarantine["reason"] == "duplicate"][["file", "line"]].reset_index(drop=True)
check_frame(
    duplicates,
    pd.DataFrame({"file": ["readings-2026-03-02.csv"] * 3, "line": [57, 64, 69]}),
    "duplicates are found in the order the files are given, keeping the first one read",
)
assert len(clean) == 122, "the order of the files does not change how many rows are kept"

empty = load_readings(["data/readings-empty.csv"])
assert len(empty) == 0, "a file with only a header gives no rows"
assert list(empty.columns) == ["file", "line", "sensor", "time", "co2_ppm", "temp_c"], (
    "a file with only a header still gives the six columns"
)
clean, quarantine = validate(empty, rooms)
assert len(clean) == 0 and list(clean.columns) == ["sensor", "room", "time", "co2_ppm", "temp_c"], (
    "validate of no rows gives a clean frame with no rows and the stated columns"
)
assert len(quarantine) == 0 and list(quarantine.columns) == [
    "file", "line", "sensor", "time", "co2_ppm", "temp_c", "reason"
], "validate of no rows gives a quarantine frame with no rows and the stated columns"
daily = summarise(clean)
assert len(daily) == 0 and list(daily.columns) == [
    "date", "room", "readings", "mean_co2", "max_co2", "high", "mean_temp"
], "summarise of no rows gives no rows and the stated columns"

three = load_readings(["data/readings-2026-03-02.csv", "data/readings-empty.csv", "data/readings-2026-03-04.csv"])
assert len(three) == 96, "an empty file among others adds no rows"
clean, quarantine = validate(three, rooms)
lines = report(clean, quarantine, summarise(clean)).splitlines()
assert lines[1:3] == ["Rows read: 96", "Rows kept: 87 (90.6%)"], "report counts the rows of every file"
assert lines[-2:] == [
    "  2026-03-02 Music room: max 1866 ppm, 4 of 12 readings high",
    "  2026-03-04 Music room: max 1650 ppm, 1 of 7 readings high",
], "report has one worst-room line per day in date order"
