# Entitlement and MFA strength by the application's sensitivity.
from datetime import datetime, timezone

now = datetime(2027, 3, 1, 12, 0, tzinfo=timezone.utc)
inventory = {
    "WS-11": {"owner": "rui", "os_patch_date": "2027-02-20", "edr_running": True, "disk_encrypted": True, "last_seen": "2027-03-01T11:00:00Z"},
}
apps = {
    "site-photos": {"sensitivity": "standard", "users": ["rui"], "countries": ["PT"]},
    "contracts": {"sensitivity": "high", "users": ["rui"], "countries": ["PT"]},
    "hr-records": {"sensitivity": "high", "users": ["dana"], "countries": ["PT"]},
}


def ask(app, mfa, user="rui"):
    return tuple(decide({"user": user, "device": "WS-11", "app": app, "mfa": mfa, "country": "PT"}, inventory, apps, now))


for mfa in ["sms", "otp", "push", "passkey"]:
    assert ask("site-photos", mfa) == ("allow", []), f"a standard application with any MFA method ({mfa})"
for mfa in ["sms", "otp", "push"]:
    assert ask("contracts", mfa) == ("deny", ["weak-mfa"]), f"a high-sensitivity application with {mfa} MFA"
assert ask("contracts", "passkey") == ("allow", []), "a high-sensitivity application with a passkey"
assert ask("site-photos", "none") == ("deny", ["no-mfa"]), "a standard application without MFA"
assert ask("contracts", "none") == ("deny", ["no-mfa"]), "a high-sensitivity application without MFA gives no-mfa only"
assert ask("hr-records", "passkey") == ("deny", ["not-entitled"]), "a user missing from the application's users"
assert ask("hr-records", "none") == ("deny", ["not-entitled", "no-mfa"]), "not entitled and without MFA, in rule order"
assert ask("hr-records", "otp", user="dana") == ("deny", ["weak-mfa", "not-owner"]), (
    "an entitled user with weak MFA on someone else's device, in rule order"
)
