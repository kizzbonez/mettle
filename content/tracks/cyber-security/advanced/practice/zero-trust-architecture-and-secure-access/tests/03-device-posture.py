# Device health and posture age, with the boundaries of PATCH_DAYS and POSTURE_HOURS.
from datetime import datetime, timezone

now = datetime(2027, 3, 1, 12, 0, tzinfo=timezone.utc)
apps = {"site-photos": {"sensitivity": "standard", "users": ["rui"], "countries": ["PT"]}}


def posture(**changes):
    device = {"owner": "rui", "os_patch_date": "2027-02-20", "edr_running": True,
              "disk_encrypted": True, "last_seen": "2027-03-01T11:00:00Z"}
    device.update(changes)
    request = {"user": "rui", "device": "WS-11", "app": "site-photos", "mfa": "otp", "country": "PT"}
    return tuple(decide(request, {"WS-11": device}, apps, now))


cases = [
    ({"os_patch_date": "2027-01-30"}, ("allow", []), "a device patched exactly 30 days before now"),
    ({"os_patch_date": "2027-01-29"}, ("deny", ["unpatched"]), "a device patched 31 days before now"),
    ({"last_seen": "2027-02-28T12:00:00Z"}, ("allow", []), "posture reported exactly 24 hours before now"),
    ({"last_seen": "2027-02-28T11:59:00Z"}, ("deny", ["stale-posture"]), "posture reported 24 hours and 1 minute before now"),
    ({"disk_encrypted": False}, ("deny", ["disk-unencrypted"]), "a device without disk encryption"),
    ({"edr_running": False}, ("deny", ["edr-off"]), "a device whose EDR agent is not running"),
    ({"owner": "dana"}, ("deny", ["not-owner"]), "a device assigned to someone else"),
    ({"owner": "dana", "edr_running": False, "disk_encrypted": False, "os_patch_date": "2026-11-02",
      "last_seen": "2027-02-10T08:00:00Z"},
     ("deny", ["not-owner", "edr-off", "disk-unencrypted", "unpatched", "stale-posture"]),
     "a device failing every health check, in rule order"),
]
for changes, expected, what in cases:
    assert posture(**changes) == expected, f"decide for {what}"
