"""Night-shift payroll: real minutes worked across time zones, written as JSON."""
import csv
import json
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal
from zoneinfo import ZoneInfo

CENT = Decimal("0.01")


def read_shifts(path):
    """Return [{"name", "start", "end"}, ...] with aware datetimes in each row's zone."""
    # YOUR CODE: csv.DictReader, strptime(text, "%Y-%m-%d %H:%M"), .replace(tzinfo=ZoneInfo(zone)).
    raise NotImplementedError


def minutes_worked(start, end):
    """Return the real whole minutes from START to END, two aware datetimes."""
    # YOUR CODE: subtract in UTC, not on the wall clock.
    raise NotImplementedError


def to_json(value):
    """Return a datetime as ISO 8601 text in UTC and a Decimal as str; else raise TypeError."""
    # YOUR CODE
    raise NotImplementedError


def payroll(path, rate):
    """Return the shifts in PATH as JSON text with name, start, minutes and pay."""
    # YOUR CODE: build a list of dicts, then json.dumps(..., default=to_json, ensure_ascii=False).
    raise NotImplementedError
