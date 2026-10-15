# check_response: the briefing deadline, power-offs and memory captures before reimaging.
import json


def write(name, rows):
    with open(name, "w") as f:
        for time, action, host in rows:
            entry = {"time": time, "phase": "Containment", "action": action, "by": "test"}
            if host is not None:
                entry["host"] = host
            f.write(json.dumps(entry) + "\n")


write("t3-a.jsonl", [
    ("2026-10-22T12:10:00Z", "reimage", "srv-g"),
    ("2026-10-22T10:00:00Z", "declare-incident", None),
    ("2026-10-22T10:20:00Z", "power-off", "SRV-B"),
    ("2026-10-22T10:10:00Z", "power-off", "srv-a"),
    ("2026-10-22T14:00:00+03:00", "brief-leadership", None),
    ("2026-10-22T11:00:00Z", "capture-memory", "srv-d"),
    ("2026-10-22T11:30:00Z", "reimage", "srv-c"),
    ("2026-10-22T11:40:00Z", "capture-memory", "srv-e"),
    ("2026-10-22T11:50:00Z", "reimage", "srv-f"),
    ("2026-10-22T13:00:00+01:00", "capture-memory", "srv-c"),
    ("2026-10-22T12:00:00Z", "reimage", "SRV-D"),
    ("2026-10-22T12:20:00Z", "reimage", "srv-g"),
])
assert check_response("t3-a.jsonl") == [
    "POWER-OFF srv-a",
    "POWER-OFF srv-b",
    "NO-MEMORY srv-c",
    "NO-MEMORY srv-f",
    "NO-MEMORY srv-g",
    "NO-MEMORY srv-g",
], "a brief exactly 60 minutes after the declaration, every power-off and every reimage without an earlier capture of that host"

write("t3-b.jsonl", [
    ("2026-10-22T07:30:00Z", "declare-incident", None),
    ("2026-10-22T08:00:01Z", "brief-leadership", None),
    ("2026-10-22T08:00:00+01:00", "declare-incident", None),
])
assert check_response("t3-b.jsonl") == ["LATE brief-leadership after 60 minutes"], (
    "the deadline runs from the first declaration in UTC, and 60 minutes and 1 second is late"
)

write("t3-c.jsonl", [("2026-10-22T09:00:00Z", "declare-incident", None), ("2026-10-22T09:05:00Z", "isolate", "srv-h")])
assert check_response("t3-c.jsonl") == ["MISSING brief-leadership"], "a declaration with no briefing"

write("t3-d.jsonl", [("2026-10-22T09:00:00Z", "isolate", "srv-h"), ("2026-10-22T12:00:00Z", "brief-leadership", None)])
assert check_response("t3-d.jsonl") == [], "with no declaration there is no briefing deadline"
