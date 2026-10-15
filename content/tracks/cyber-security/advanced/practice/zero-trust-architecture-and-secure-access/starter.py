"""The policy engine's per-session decision for Larchmont Architects' ZTNA broker."""
from datetime import date, datetime, timedelta, timezone

PATCH_DAYS = 30      # a device patched more than 30 days ago is unpatched
POSTURE_HOURS = 24   # posture reported more than 24 hours ago is stale


def decide(request, inventory, apps, now):
    """Return (decision, reasons) for one access request; decision is allow, limited or deny."""
    # 1. Unknown application: deny at once.
    # 2. Collect the failed rules in order: entitlement, MFA, device (inventory, owner, EDR,
    #    disk, patches, posture age), country.
    # 3. allow, limited (only unmanaged-device, standard app) or deny.
    # YOUR CODE
    raise NotImplementedError
