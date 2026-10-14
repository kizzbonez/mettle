# read_shifts: quoted names, several zones, aware values with the right offsets, and an empty file.
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

Path("t2-shifts.csv").write_text(
    "name,start,end,zone\n"
    '"Okafor, Ada",2026-10-03 22:00,2026-10-04 06:00,Australia/Sydney\n'
    "Zoë,2026-07-14 23:30,2026-07-15 07:15,Europe/Lisbon\n"
    '"Lee ""Doc"" Park",2026-12-31 20:00,2027-01-01 04:00,America/New_York\n',
    encoding="utf-8",
)
shifts = read_shifts("t2-shifts.csv")
assert [s["name"] for s in shifts] == ["Okafor, Ada", "Zoë", 'Lee "Doc" Park'], (
    "read_shifts should read quoted names with commas and doubled quotes, in file order"
)
for shift in shifts:
    assert set(shift) == {"name", "start", "end"}, f"each shift should have exactly the keys name, start and end, not {set(shift)}"
    assert isinstance(shift["start"], datetime) and isinstance(shift["end"], datetime), "start and end should be datetimes"
    assert shift["start"].tzinfo is not None and shift["end"].tzinfo is not None, "start and end should be aware datetimes"

sydney = shifts[0]
assert sydney["start"] == datetime(2026, 10, 3, 22, 0, tzinfo=ZoneInfo("Australia/Sydney")), "the Sydney start, 22:00 local"
assert sydney["start"].utcoffset() == timedelta(hours=10), "the Sydney start should be in standard time, UTC+10"
assert sydney["end"].utcoffset() == timedelta(hours=11), "the Sydney end, after the clocks went forward, should be UTC+11"

lisbon = shifts[1]
assert (lisbon["start"].hour, lisbon["start"].minute, lisbon["end"].hour, lisbon["end"].minute) == (23, 30, 7, 15), (
    "the wall-clock times of the file should be kept as they are, not converted"
)
assert lisbon["end"].utcoffset() == timedelta(hours=1), "Lisbon in July is on summer time, UTC+1"
new_york = shifts[2]
assert new_york["end"] == datetime(2027, 1, 1, 4, 0, tzinfo=ZoneInfo("America/New_York")), "a shift across the new year"

Path("t2-empty.csv").write_text("name,start,end,zone\n", encoding="utf-8")
assert read_shifts("t2-empty.csv") == [], "a file with only the header has no shifts"
