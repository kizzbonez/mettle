"""Account indicators from the identity provider: MFA fatigue and concurrent sessions."""
import csv
from collections import defaultdict
from datetime import datetime, timedelta

REJECTED = {"denied", "timeout"}


def mfa_fatigue(path, limit=5, window_minutes=10):
    """Return [(user, status), ...] for users under MFA fatigue, sorted by user."""
    # YOUR CODE:
    # 1. Group each user's rejected prompts and approvals (datetime.fromisoformat reads the times).
    # 2. "approved-after-fatigue": an approval with >= limit rejected prompts in the window before it.
    # 3. "fatigue": otherwise, >= limit rejected prompts within any window of window_minutes.
    raise NotImplementedError


def concurrent_sessions(path):
    """Return [(user, session_a, session_b), ...] for overlapping sessions from two countries."""
    # YOUR CODE: compare every pair of one user's sessions; an empty end means still active.
    raise NotImplementedError
