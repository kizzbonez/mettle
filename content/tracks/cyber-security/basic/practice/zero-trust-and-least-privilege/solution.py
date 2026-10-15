"""A Zero Trust gate: every request is checked on its own, and the network it came from never counts.

The loading and printing are already written. Write the body of decide, where it says YOUR CODE.
"""
import csv
from datetime import date

TODAY = date(2026, 11, 2)   # the day the decisions are made
PATCH_DAYS = 30             # a device must have been patched within this many days


def load_devices(path):
    """Return {device: {"managed": "yes" or "no", "encrypted": "yes" or "no", "last_patched": date}}."""
    devices = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            devices[row["device"].strip()] = {
                "managed": row["managed"].strip().lower(),
                "encrypted": row["encrypted"].strip().lower(),
                "last_patched": date.fromisoformat(row["last_patched"].strip()),
            }
    return devices


def load_entitlements(path):
    """Return {user: {resource: "read" or "write"}}: what each user may do to each resource."""
    entitlements = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            user = row["user"].strip()
            entitlements.setdefault(user, {})[row["resource"].strip()] = row["access"].strip().lower()
    return entitlements


def load_requests(path):
    """Return the requests as a list of dicts with the keys user, device, network, resource, action, mfa."""
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def decide(request, devices, entitlements, today=TODAY):
    """Return "allow" or "deny (REASON)" for one request. Never look at request["network"]."""
    if request["mfa"].strip().lower() != "yes":
        return "deny (identity not verified)"

    device = devices.get(request["device"])
    if (
        device is None
        or device["managed"] != "yes"
        or device["encrypted"] != "yes"
        or (today - device["last_patched"]).days > PATCH_DAYS
    ):
        return "deny (device not compliant)"

    access = entitlements.get(request["user"], {}).get(request["resource"])
    if access is None or (request["action"] == "write" and access != "write"):
        return "deny (not entitled)"

    return "allow"


if __name__ == "__main__":
    devices = load_devices("data/devices.csv")
    entitlements = load_entitlements("data/entitlements.csv")
    for request in load_requests("data/requests.csv"):
        where = " ".join(request[key] for key in ("user", "device", "network", "resource", "action"))
        print(f"{where}: {decide(request, devices, entitlements)}")
