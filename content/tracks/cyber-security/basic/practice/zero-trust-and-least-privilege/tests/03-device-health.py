# Device health: known, managed, encrypted and patched within 30 days of the decision day.
from datetime import date

with open("t3-devices.csv", "w", encoding="utf-8") as f:
    f.write(
        "device,managed,encrypted,last_patched\n"
        "edge-30,yes,yes,2026-11-01\n"
        "edge-31,yes,yes,2026-10-31\n"
        "today,Yes,YES,2026-12-01\n"
        "unmanaged,no,yes,2026-11-28\n"
        "plain-disk,yes,no,2026-11-28\n"
    )
devices = load_devices("t3-devices.csv")
entitlements = {"mei": {"routes": "read"}}
day = date(2026, 12, 1)


def ask(device):
    request = {"user": "mei", "device": device, "network": "warehouse", "resource": "routes", "action": "read", "mfa": "yes"}
    return decide(request, devices, entitlements, day)


assert ask("edge-30") == "allow", "a device patched exactly 30 days before the decision day is still compliant"
assert ask("edge-31") == "deny (device not compliant)", "a device patched 31 days before the decision day is not compliant"
assert ask("today") == "allow", "a managed, encrypted device patched on the decision day is compliant"
assert ask("unmanaged") == "deny (device not compliant)", "an unmanaged device is not compliant"
assert ask("plain-disk") == "deny (device not compliant)", "a device without disk encryption is not compliant"
assert ask("visitor-phone") == "deny (device not compliant)", "a device missing from the inventory is not compliant"
assert decide(
    {"user": "mei", "device": "edge-30", "network": "warehouse", "resource": "routes", "action": "read", "mfa": "yes"},
    devices, entitlements, date(2026, 12, 2),
) == "deny (device not compliant)", "the patch age is counted from the day passed to decide, not a fixed day"
