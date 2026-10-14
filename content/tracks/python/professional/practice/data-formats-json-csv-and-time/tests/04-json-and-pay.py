# to_json for datetimes and decimals, TypeError for the rest, and payroll's rounding and text.
import json
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from zoneinfo import ZoneInfo

assert to_json(datetime(2026, 6, 2, 6, 0, tzinfo=ZoneInfo("Asia/Tokyo"))) == "2026-06-01T21:00:00+00:00", (
    "to_json should write a datetime in another zone as ISO 8601 text in UTC"
)
assert to_json(datetime(2026, 1, 1, 0, 0, tzinfo=UTC)) == "2026-01-01T00:00:00+00:00", "to_json of a UTC datetime"
assert to_json(Decimal("0.10")) == "0.10", "to_json should keep a Decimal's digits, trailing zero included"
for value in [{1, 2}, object(), b"bytes"]:
    try:
        to_json(value)
    except TypeError:
        continue
    raise AssertionError(f"to_json should raise TypeError for a {type(value).__name__}")

Path("t4-shifts.csv").write_text(
    "name,start,end,zone\n"
    '"Okafor, Ada",2026-06-01 06:00,2026-06-01 06:30,Europe/Lisbon\n'
    "Zoë,2026-06-01 22:00,2026-06-02 06:50,Europe/Lisbon\n",
    encoding="utf-8",
)
text = payroll("t4-shifts.csv", "16.33")
entries = json.loads(text)
assert [e["name"] for e in entries] == ["Okafor, Ada", "Zoë"], "payroll should keep the shifts in file order"
assert entries[0] == {"name": "Okafor, Ada", "start": "2026-06-01T05:00:00+00:00", "minutes": 30, "pay": "8.17"}, (
    f"30 minutes at 16.33 is exactly 8.165, which rounds half up to cents; the first entry was {entries[0]}"
)
assert entries[1]["minutes"] == 530 and entries[1]["pay"] == "144.25", (
    f"530 minutes at 16.33 should be paid in cents, as a string; the second entry was {entries[1]}"
)
assert "Zoë" in text, "payroll should write non-ASCII names as they are (ensure_ascii=False)"

Path("t4-empty.csv").write_text("name,start,end,zone\n", encoding="utf-8")
assert json.loads(payroll("t4-empty.csv", "20")) == [], "payroll of a file without shifts should be an empty JSON list"
