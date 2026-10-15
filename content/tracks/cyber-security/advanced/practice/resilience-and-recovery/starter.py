"""Checks behind Saltmarsh Logistics' disaster recovery plan: availability, backup gaps, restore tests."""
from datetime import date, datetime

TEST_INTERVAL_DAYS = 90


def availability(mtbf, mttr, nodes=1):
    """Return the availability of NODES independent nodes, any one of which carries the load."""
    # YOUR CODE
    raise NotImplementedError


def backup_gap(jobs, system, start, end):
    """Return the longest gap in whole minutes between start, the successful backups and end."""
    # YOUR CODE: only this system, status success, finished inside the window; sort the times.
    raise NotImplementedError


def restore_findings(tests, system, rto_minutes, today):
    """Return no-test, or stale/slow/unverified findings for the system's latest restore test."""
    # YOUR CODE
    raise NotImplementedError
