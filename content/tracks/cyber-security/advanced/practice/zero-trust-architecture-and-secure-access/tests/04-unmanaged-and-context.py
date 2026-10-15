# Unmanaged devices, limited sessions, countries and unknown applications.
from datetime import datetime, timezone

now = datetime(2027, 3, 1, 12, 0, tzinfo=timezone.utc)
inventory = {
    "WS-11": {"owner": "rui", "os_patch_date": "2027-02-20", "edr_running": True, "disk_encrypted": True, "last_seen": "2027-03-01T11:00:00Z"},
}
apps = {
    "site-photos": {"sensitivity": "standard", "users": ["rui", "kim"], "countries": ["PT", "es"]},
    "contracts": {"sensitivity": "high", "users": ["rui", "kim"], "countries": ["PT"]},
}


def ask(device, app, mfa="passkey", country="PT", user="kim"):
    request = {"user": user, "device": device, "app": app, "mfa": mfa, "country": country}
    return tuple(decide(request, inventory, apps, now))


assert ask("TABLET-7", "site-photos", mfa="otp") == ("limited", ["unmanaged-device"]), (
    "an unmanaged device for a standard application, with nothing else failing"
)
assert ask("TABLET-7", "contracts") == ("deny", ["unmanaged-device"]), "an unmanaged device for a high-sensitivity application"
assert ask("TABLET-7", "site-photos", mfa="none") == ("deny", ["no-mfa", "unmanaged-device"]), (
    "an unmanaged device for a standard application without MFA"
)
assert ask("TABLET-7", "site-photos", country="FR") == ("deny", ["unmanaged-device", "blocked-country"]), (
    "an unmanaged device for a standard application from a country that is not allowed"
)
assert ask("WS-11", "site-photos", country="pt", user="rui") == ("allow", []), "a country code in lower case"
assert ask("WS-11", "site-photos", country="ES", user="rui") == ("allow", []), "an allowed country written in lower case in apps"
assert ask("WS-11", "contracts", country="ES", user="rui") == ("deny", ["blocked-country"]), "a country the application does not allow"
assert ask("TABLET-7", "wiki-old", mfa="none", country="XX", user="nobody") == ("deny", ["unknown-app"]), (
    "an unknown application stops before any other rule"
)
