"""The policy engine's per-session decision for Larchmont Architects' ZTNA broker."""
from datetime import date, datetime, timedelta, timezone

PATCH_DAYS = 30      # a device patched more than 30 days ago is unpatched
POSTURE_HOURS = 24   # posture reported more than 24 hours ago is stale


def device_reasons(user, device, now):
    reasons = []
    if device["owner"] != user:
        reasons.append("not-owner")
    if device["edr_running"] is not True:
        reasons.append("edr-off")
    if device["disk_encrypted"] is not True:
        reasons.append("disk-unencrypted")
    if (now.date() - date.fromisoformat(device["os_patch_date"])).days > PATCH_DAYS:
        reasons.append("unpatched")
    if now - datetime.fromisoformat(device["last_seen"]) > timedelta(hours=POSTURE_HOURS):
        reasons.append("stale-posture")
    return reasons


def decide(request, inventory, apps, now):
    """Return (decision, reasons) for one access request; decision is allow, limited or deny."""
    app = apps.get(request["app"])
    if app is None:
        return "deny", ["unknown-app"]
    user = request["user"]
    reasons = []
    if user not in app["users"]:
        reasons.append("not-entitled")
    if request["mfa"] == "none":
        reasons.append("no-mfa")
    elif app["sensitivity"] == "high" and request["mfa"] != "passkey":
        reasons.append("weak-mfa")
    if request["device"] not in inventory:
        reasons.append("unmanaged-device")
    else:
        reasons += device_reasons(user, inventory[request["device"]], now)
    if request["country"].upper() not in {country.upper() for country in app["countries"]}:
        reasons.append("blocked-country")

    if not reasons:
        return "allow", reasons
    if reasons == ["unmanaged-device"] and app["sensitivity"] == "standard":
        return "limited", reasons
    return "deny", reasons
