# review_actions: blank lines, only allowed actions count toward the limit, and an empty file.
import json

with open("t4-policy.json", "w") as f:
    json.dump({
        "tools": {"edr.isolate_host": {"allowed": True, "requires_approval": "soc-lead", "max_per_hour": 2}},
        "protected_hosts": ["dc-01"],
    }, f)

rows = [
    ("X-1", "02:00:00", "lt-1", "soc-lead"),
    ("X-2", "02:10:00", "lt-2", None),
    None,
    ("X-3", "02:20:00", "lt-3", "soc-lead"),
    ("X-4", "02:30:00", "dc-01", "soc-lead"),
    ("X-5", "02:40:00", "lt-4", "soc-lead"),
    None,
    ("X-6", "03:00:00", "lt-5", "soc-lead"),
    ("X-7", "03:05:00", "lt-6", "soc-lead"),
    ("X-8", "03:21:00", "lt-7", "soc-lead"),
]
with open("t4-actions.jsonl", "w") as f:
    for row in rows:
        if row is None:
            f.write("\n")
            continue
        ident, clock, host, approver = row
        action = {"id": ident, "time": f"2026-10-15T{clock}Z", "tool": "edr.isolate_host", "args": {"host": host}}
        if approver:
            action["approved_by"] = approver
        f.write(json.dumps(action) + "\n")

got = review_actions("t4-policy.json", "t4-actions.jsonl")
assert got == [
    "X-1 allow",
    "X-2 hold: needs approval by soc-lead",
    "X-3 allow",
    "X-4 deny: protected host",
    "X-5 deny: rate limit",
    "X-6 allow",
    "X-7 deny: rate limit",
    "X-8 allow",
], "held and denied actions do not count toward the rate limit, and the hour slides with each action"

open("t4-empty.jsonl", "w").close()
assert review_actions("t4-policy.json", "t4-empty.jsonl") == [], "an empty actions file gives an empty list"
