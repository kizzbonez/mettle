"""Account indicators from the identity provider: MFA fatigue and concurrent sessions."""
import csv
from collections import defaultdict
from datetime import datetime, timedelta

REJECTED = {"denied", "timeout"}


def _time(text):
    return datetime.fromisoformat(text.strip())


def mfa_fatigue(path, limit=5, window_minutes=10):
    """Return [(user, status), ...] for users under MFA fatigue, sorted by user."""
    window = timedelta(minutes=window_minutes)
    rejected = defaultdict(list)
    approved = defaultdict(list)
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            result = row["result"].strip().lower()
            when = _time(row["time"])
            if result in REJECTED:
                rejected[row["user"]].append(when)
            elif result == "approved":
                approved[row["user"]].append(when)

    findings = []
    for user in sorted(rejected):
        times = sorted(rejected[user])
        suspicious = any(
            sum(1 for t in times if ok - window <= t <= ok) >= limit for ok in approved[user]
        )
        burst = any(
            sum(1 for t in times if start <= t <= start + window) >= limit for start in times
        )
        if suspicious:
            findings.append((user, "approved-after-fatigue"))
        elif burst:
            findings.append((user, "fatigue"))
    return findings


def concurrent_sessions(path):
    """Return [(user, session_a, session_b), ...] for overlapping sessions from two countries."""
    by_user = defaultdict(list)
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            end = _time(row["end"]) if row["end"].strip() else None
            by_user[row["user"]].append(
                (row["session"].strip(), _time(row["start"]), end, row["country"].strip().upper())
            )

    pairs = []
    for user, sessions in by_user.items():
        for i, (id_a, start_a, end_a, country_a) in enumerate(sessions):
            for id_b, start_b, end_b, country_b in sessions[i + 1:]:
                if country_a == country_b:
                    continue
                a_before_b_ends = end_b is None or start_a < end_b
                b_before_a_ends = end_a is None or start_b < end_a
                if a_before_b_ends and b_before_a_ends:
                    pairs.append((user, *sorted([id_a, id_b])))
    return sorted(pairs)
