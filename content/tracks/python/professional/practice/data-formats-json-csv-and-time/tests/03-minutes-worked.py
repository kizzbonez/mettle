# minutes_worked: real elapsed minutes across daylight saving changes, days and zones.
from datetime import UTC, datetime
from zoneinfo import ZoneInfo

lisbon = ZoneInfo("Europe/Lisbon")
sydney = ZoneInfo("Australia/Sydney")
tokyo = ZoneInfo("Asia/Tokyo")

cases = [
    ("an ordinary night", datetime(2026, 6, 1, 22, 0, tzinfo=lisbon), datetime(2026, 6, 2, 6, 0, tzinfo=lisbon), 480),
    ("the night the clocks go back", datetime(2026, 10, 24, 22, 0, tzinfo=lisbon), datetime(2026, 10, 25, 6, 0, tzinfo=lisbon), 540),
    ("the night the clocks go forward", datetime(2026, 3, 28, 22, 0, tzinfo=lisbon), datetime(2026, 3, 29, 6, 0, tzinfo=lisbon), 420),
    ("Sydney's spring change", datetime(2026, 10, 3, 22, 0, tzinfo=sydney), datetime(2026, 10, 4, 6, 0, tzinfo=sydney), 420),
    ("a shift of more than a day", datetime(2026, 10, 24, 6, 0, tzinfo=lisbon), datetime(2026, 10, 25, 8, 0, tzinfo=lisbon), 1620),
    ("a start and an end in different zones", datetime(2026, 6, 1, 10, 0, tzinfo=lisbon), datetime(2026, 6, 2, 6, 0, tzinfo=tokyo), 720),
    ("two UTC times", datetime(2026, 1, 1, 0, 0, tzinfo=UTC), datetime(2026, 1, 1, 0, 45, tzinfo=UTC), 45),
    ("no time at all", datetime(2026, 5, 5, 9, 0, tzinfo=lisbon), datetime(2026, 5, 5, 9, 0, tzinfo=lisbon), 0),
]
for label, start, end, minutes in cases:
    got = minutes_worked(start, end)
    assert type(got) is int, f"minutes_worked should return an int ({label})"
    assert got == minutes, f"minutes_worked for {label} should count the real minutes in between"
