# Least privilege: write access covers reading, read access never covers writing,
# and the network a request comes from changes nothing.
from datetime import date

day = date(2026, 12, 1)
devices = {"lt-1": {"managed": "yes", "encrypted": "yes", "last_patched": date(2026, 11, 25)}}
entitlements = {
    "sol": {"manifests": "write", "rates": "read"},
    "ines": {"rates": "write"},
}


def ask(user, resource, action, network="office", mfa="yes"):
    request = {"user": user, "device": "lt-1", "network": network, "resource": resource, "action": action, "mfa": mfa}
    return decide(request, devices, entitlements, day)


assert ask("sol", "manifests", "read") == "allow", "write access also allows reading"
assert ask("sol", "manifests", "write") == "allow", "write access allows writing"
assert ask("sol", "rates", "read") == "allow", "read access allows reading"
assert ask("sol", "rates", "write") == "deny (not entitled)", "read access does not allow writing"
assert ask("ines", "manifests", "read") == "deny (not entitled)", "another user's entitlement does not count"
assert ask("nobody", "rates", "read") == "deny (not entitled)", "a user with no entitlements at all is not entitled"

for network in ["office", "data-centre", "vpn", "cafe-wifi", ""]:
    assert ask("sol", "rates", "read", network) == "allow", "the network a request comes from must not change an allow"
    assert ask("sol", "rates", "read", network, mfa="no") == "deny (identity not verified)", (
        "the network a request comes from must not excuse a failed MFA check"
    )
