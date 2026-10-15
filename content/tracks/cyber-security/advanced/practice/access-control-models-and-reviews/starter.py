"""Access decisions and the monthly access review for Corran Hospital's pharmacy system."""
from datetime import date, datetime, time, timedelta

MAX_JIT_MINUTES = 120
CONFLICTS = [("order-stock", "receive-stock"), ("approve-controlled", "view-audit")]


def decide(policy, user, permission, at):
    """Return (decision, via): unknown user, expired, a role in its hours, a valid JIT grant, or deny."""
    # YOUR CODE: the five rules in order. Hours wrap past midnight when end <= start.
    raise NotImplementedError


def review(policy, review_date):
    """Return the EXPIRED and SOD findings per user, then the JIT-INVALID findings."""
    # YOUR CODE
    raise NotImplementedError
