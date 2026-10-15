"""Access decisions and the monthly access review for Corran Hospital's pharmacy system."""
from datetime import date, datetime, time, timedelta

MAX_JIT_MINUTES = 120
CONFLICTS = [("order-stock", "receive-stock"), ("approve-controlled", "view-audit")]


def in_hours(hours, moment):
    if hours is None:
        return True
    start, end = time.fromisoformat(hours[0]), time.fromisoformat(hours[1])
    if end > start:
        return start <= moment < end
    return moment >= start or moment < end


def valid_grant(grant):
    return bool(grant["ticket"]) and grant["minutes"] <= MAX_JIT_MINUTES


def role_permissions(policy, user):
    granted = set()
    for role in policy["users"][user]["roles"]:
        granted |= set(policy["roles"].get(role, {}).get("permissions", []))
    return granted


def decide(policy, user, permission, at):
    """Return (decision, via): unknown user, expired, a role in its hours, a valid JIT grant, or deny."""
    account = policy["users"].get(user)
    if account is None:
        return "deny", "unknown-user"
    if account["expires"] and at.date() > date.fromisoformat(account["expires"]):
        return "deny", "expired"
    for name in account["roles"]:
        role = policy["roles"].get(name)
        if role and permission in role["permissions"] and in_hours(role["hours"], at.time()):
            return "allow", f"role:{name}"
    for grant in policy["jit"]:
        if grant["user"] == user and grant["permission"] == permission and valid_grant(grant):
            start = datetime.fromisoformat(grant["start"])
            if start <= at < start + timedelta(minutes=grant["minutes"]):
                return "allow", f"jit:{grant['ticket']}"
    if permission in role_permissions(policy, user):
        return "deny", "outside-hours"
    return "deny", "not-granted"


def review(policy, review_date):
    """Return the EXPIRED and SOD findings per user, then the JIT-INVALID findings."""
    findings = []
    for user, account in policy["users"].items():
        expires = account["expires"]
        if expires and date.fromisoformat(expires) < review_date and account["roles"]:
            findings.append(f"EXPIRED {user} {expires}")
        granted = role_permissions(policy, user)
        for first, second in CONFLICTS:
            if first in granted and second in granted:
                findings.append(f"SOD {user} {first}+{second}")
    for grant in policy["jit"]:
        if not grant["ticket"]:
            findings.append(f"JIT-INVALID {grant['user']} {grant['permission']} no-ticket")
        elif grant["minutes"] > MAX_JIT_MINUTES:
            findings.append(f"JIT-INVALID {grant['user']} {grant['permission']} too-long")
    return findings
