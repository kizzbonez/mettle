# The example from the instructions.
import json
from datetime import datetime, timezone

with open("data/inventory.json") as handle:
    inventory = json.load(handle)
with open("data/apps.json") as handle:
    apps = json.load(handle)
with open("data/requests.json") as handle:
    requests = json.load(handle)

now = datetime(2026, 10, 15, 9, 0, tzinfo=timezone.utc)
expected = [
    ("allow", []),
    ("deny", ["weak-mfa"]),
    ("deny", ["unpatched"]),
    ("deny", ["edr-off", "stale-posture"]),
    ("limited", ["unmanaged-device"]),
    ("deny", ["not-owner", "blocked-country"]),
    ("deny", ["not-entitled"]),
    ("deny", ["unknown-app"]),
]
for request, want in zip(requests, expected):
    got = decide(request, inventory, apps, now)
    who = f"{request['user']} on {request['device']} to {request['app']} with {request['mfa']} from {request['country']}"
    assert tuple(got) == want, f"decide for {who} (see the example table), got {got!r}"
