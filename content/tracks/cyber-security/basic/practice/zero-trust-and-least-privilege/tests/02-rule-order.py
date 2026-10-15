# The rules are checked in order: identity, then device, then entitlement.
from datetime import date

day = date(2026, 12, 1)
devices = {
    "good": {"managed": "yes", "encrypted": "yes", "last_patched": date(2026, 11, 20)},
    "bad": {"managed": "no", "encrypted": "yes", "last_patched": date(2026, 11, 20)},
}
entitlements = {"kofi": {"invoices": "write"}}


def ask(mfa, device, resource, action="read", user="kofi", network="office"):
    request = {"user": user, "device": device, "network": network, "resource": resource, "action": action, "mfa": mfa}
    return decide(request, devices, entitlements, day)


assert ask("no", "bad", "payroll") == "deny (identity not verified)", "a request failing every rule is denied for identity first"
assert ask("no", "good", "invoices") == "deny (identity not verified)", "a request without MFA is denied even when device and entitlement are fine"
assert ask("yes", "bad", "payroll") == "deny (device not compliant)", "with MFA passed, a bad device is reported before a missing entitlement"
assert ask("yes", "good", "payroll") == "deny (not entitled)", "with identity and device fine, a resource the user has no entitlement for is denied"
assert ask(" YES ", "good", "invoices") == "allow", "the mfa field is compared without regard to case and surrounding spaces"
assert ask("", "good", "invoices") == "deny (identity not verified)", "an empty mfa field means MFA did not pass"
assert ask("true", "good", "invoices") == "deny (identity not verified)", "only the word yes means MFA passed"
