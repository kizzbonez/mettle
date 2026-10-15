"""Apply data subject requests while honoring legal holds and retention requirements."""
import calendar
import csv
import json
from datetime import date


def read_rows(path):
    """Return the rows of the CSV file at PATH as dictionaries (blank lines are skipped)."""
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def due_date(received):
    """One month after RECEIVED, clamped to the last day of the month."""
    d = date.fromisoformat(received)
    year, month = (d.year + 1, 1) if d.month == 12 else (d.year, d.month + 1)
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day).isoformat()


def apply_requests(members_path, invoices_path, holds_path, requests_path, as_of):
    """Return (members by id, outcome strings) after applying the requests."""
    with open(members_path) as f:
        members = {m["id"]: m for m in json.load(f)}
    with open(holds_path) as f:
        held = {m for hold in json.load(f) if hold["released"] is None for m in hold["members"]}
    today = date.fromisoformat(as_of)
    cutoff = today.replace(year=today.year - 7).isoformat()
    retained = {row["member"] for row in read_rows(invoices_path) if row["date"] >= cutoff}

    outcomes = []
    requests = sorted(read_rows(requests_path), key=lambda r: (r["received"], r["request"]))
    for req in requests:
        member_id, kind = req["member"], req["type"]
        record = members.get(member_id)
        if record is None:
            outcome = "not-found"
        elif kind == "erasure":
            if member_id in held:
                outcome = "held"
            elif member_id in retained:
                record.update(email="", marketing=False, restricted=True)
                outcome = "restricted"
            else:
                del members[member_id]
                outcome = "erased"
        elif kind in ("opt-out", "objection"):
            record["marketing"] = False
            outcome = "done"
        elif kind == "restriction":
            record["restricted"] = True
            outcome = "done"
        elif kind == "correction":
            if member_id in held:
                outcome = "held"
            elif req["field"] not in ("name", "email"):
                outcome = "rejected"
            else:
                record[req["field"]] = req["value"]
                outcome = "done"
        else:
            outcome = "rejected"
        outcomes.append(f"{req['request']} {outcome}")
    return members, outcomes
