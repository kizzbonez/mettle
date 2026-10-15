# check_response: the 72-hour notification of the authority, and an empty log.
import json


def write(name, rows):
    with open(name, "w") as f:
        for time, action in rows:
            f.write(json.dumps({"time": time, "phase": "Notification and external reporting", "action": action, "by": "DPO"}) + "\n")


write("t4-e.jsonl", [("2026-10-23T09:00:00+02:00", "breach-confirmed"), ("2026-10-26T07:00:00Z", "notify-authority")])
assert check_response("t4-e.jsonl") == [], "exactly 72 hours after the breach was confirmed is in time"

write("t4-f.jsonl", [("2026-10-26T08:01:00+01:00", "notify-authority"), ("2026-10-23T07:00:00Z", "breach-confirmed")])
assert check_response("t4-f.jsonl") == ["LATE notify-authority after 72 hours"], "72 hours and 1 minute is late, in whole hours"

write("t4-g.jsonl", [("2026-10-23T07:00:00Z", "breach-confirmed")])
assert check_response("t4-g.jsonl") == ["MISSING notify-authority"], "a confirmed breach that was never notified"

write("t4-h.jsonl", [
    ("2026-10-24T10:00:00Z", "breach-confirmed"),
    ("2026-10-25T10:00:00Z", "notify-authority"),
    ("2026-10-20T10:00:00Z", "breach-confirmed"),
])
assert check_response("t4-h.jsonl") == ["LATE notify-authority after 120 hours"], "the clock starts at the first breach-confirmed in UTC"

open("t4-empty.jsonl", "w").close()
assert timeline("t4-empty.jsonl") == [], "an empty log has an empty timeline"
assert check_response("t4-empty.jsonl") == [], "an empty log has no findings"
