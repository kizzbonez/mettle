"""Night-shift payroll: real minutes worked across time zones, written as JSON."""
import csv
import json
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal
from zoneinfo import ZoneInfo

CENT = Decimal("0.01")


def local_time(text, zone):
    """Return the wall-clock TEXT ("YYYY-MM-DD HH:MM") as an aware datetime in ZONE."""
    return datetime.strptime(text, "%Y-%m-%d %H:%M").replace(tzinfo=ZoneInfo(zone))


def read_shifts(path):
    """Return [{"name", "start", "end"}, ...] with aware datetimes in each row's zone."""
    with open(path, newline="", encoding="utf-8") as file:
        return [
            {
                "name": row["name"],
                "start": local_time(row["start"], row["zone"]),
                "end": local_time(row["end"], row["zone"]),
            }
            for row in csv.DictReader(file)
        ]


def minutes_worked(start, end):
    """Return the real whole minutes from START to END, two aware datetimes."""
    elapsed = end.astimezone(UTC) - start.astimezone(UTC)
    return int(elapsed.total_seconds() // 60)


def to_json(value):
    """Return a datetime as ISO 8601 text in UTC and a Decimal as str; else raise TypeError."""
    if isinstance(value, datetime):
        return value.astimezone(UTC).isoformat()
    if isinstance(value, Decimal):
        return str(value)
    raise TypeError(f"cannot store {type(value).__name__} as JSON")


def payroll(path, rate):
    """Return the shifts in PATH as JSON text with name, start, minutes and pay."""
    entries = []
    for shift in read_shifts(path):
        minutes = minutes_worked(shift["start"], shift["end"])
        pay = (Decimal(rate) * minutes / 60).quantize(CENT, rounding=ROUND_HALF_UP)
        entries.append({"name": shift["name"], "start": shift["start"], "minutes": minutes, "pay": pay})
    return json.dumps(entries, default=to_json, ensure_ascii=False)
