# The example from the instructions: data/shifts.csv at 18.50 an hour.
import json
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

shifts = read_shifts("data/shifts.csv")
assert len(shifts) == 3, f"read_shifts should return one dict per row of data/shifts.csv, 3 in all, not {len(shifts)}"
first = shifts[0]
assert first["name"] == "Inês", f"the first shift's name should be 'Inês', not {first['name']!r}"
assert first["start"] == datetime(2026, 10, 24, 22, 0, tzinfo=ZoneInfo("Europe/Lisbon")), (
    f"the first shift should start at 22:00 on 24 October 2026 in Europe/Lisbon, not {first['start']!r}"
)
assert first["start"].tzinfo is not None, "start should be an aware datetime, with the row's zone attached"

minutes = minutes_worked(first["start"], first["end"])
assert minutes == 540, f"the night the clocks go back lasts 540 real minutes, not {minutes}"
assert to_json(Decimal("166.50")) == "166.50", "to_json(Decimal('166.50')) should be '166.50'"

text = payroll("data/shifts.csv", "18.50")
assert isinstance(text, str), "payroll should return JSON text, a str"
expected = [
    {"name": "Inês", "start": "2026-10-24T21:00:00+00:00", "minutes": 540, "pay": "166.50"},
    {"name": "Inês", "start": "2026-10-25T22:00:00+00:00", "minutes": 480, "pay": "148.00"},
    {"name": "Marcus", "start": "2026-11-01T02:00:00+00:00", "minutes": 540, "pay": "166.50"},
]
assert json.loads(text) == expected, f"payroll('data/shifts.csv', '18.50') should be the JSON for:\n{expected}\nIt was:\n{text}"
assert "Inês" in text, "payroll should keep non-ASCII names readable (ensure_ascii=False)"
