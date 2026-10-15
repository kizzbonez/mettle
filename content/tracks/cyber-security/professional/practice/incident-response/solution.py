"""Rebuild an incident's timeline in UTC and check the response against the playbook."""
import json
from datetime import datetime, timezone


def load_entries(path):
    """The log entries in UTC time order, with cleaned phase and host."""
    entries = []
    with open(path) as f:
        for line in f:
            if not line.strip():
                continue
            entry = json.loads(line)
            entries.append({
                "when": datetime.fromisoformat(entry["time"]).astimezone(timezone.utc),
                "phase": entry["phase"].strip().lower(),
                "action": entry["action"],
                "host": entry.get("host", "").strip().lower(),
            })
    return sorted(entries, key=lambda e: e["when"])


def timeline(path):
    """Return "TIME [PHASE] ACTION HOST" strings in UTC time order."""
    lines = []
    for e in load_entries(path):
        line = f"{e['when'].strftime('%Y-%m-%dT%H:%M:%SZ')} [{e['phase']}] {e['action']}"
        if e["host"]:
            line += f" {e['host']}"
        lines.append(line)
    return lines


def first(entries, action):
    for e in entries:
        if e["action"] == action:
            return e["when"]
    return None


def deadline(entries, start, finish, limit_seconds, unit_seconds, unit):
    """A LATE or MISSING finding for FINISH after START, or None."""
    started = first(entries, start)
    if started is None:
        return None
    finished = first(entries, finish)
    if finished is None:
        return f"MISSING {finish}"
    elapsed = (finished - started).total_seconds()
    if elapsed > limit_seconds:
        return f"LATE {finish} after {int(elapsed // unit_seconds)} {unit}"
    return None


def check_response(path):
    """Return the findings of the playbook checks, in the order of the instructions."""
    entries = load_entries(path)
    findings = []
    brief = deadline(entries, "declare-incident", "brief-leadership", 60 * 60, 60, "minutes")
    if brief:
        findings.append(brief)
    for e in entries:
        if e["action"] == "power-off":
            findings.append(f"POWER-OFF {e['host']}")
    captured = set()
    for e in entries:
        if e["action"] == "capture-memory":
            captured.add(e["host"])
        elif e["action"] == "reimage" and e["host"] not in captured:
            findings.append(f"NO-MEMORY {e['host']}")
    authority = deadline(entries, "breach-confirmed", "notify-authority", 72 * 3600, 3600, "hours")
    if authority:
        findings.append(authority)
    return findings
