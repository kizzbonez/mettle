"""Checks behind Saltmarsh Logistics' disaster recovery plan: availability, backup gaps, restore tests."""
from datetime import date, datetime

TEST_INTERVAL_DAYS = 90


def availability(mtbf, mttr, nodes=1):
    """Return the availability of NODES independent nodes, any one of which carries the load."""
    single = mtbf / (mtbf + mttr)
    return 1 - (1 - single) ** nodes


def backup_gap(jobs, system, start, end):
    """Return the longest gap in whole minutes between start, the successful backups and end."""
    times = sorted(
        finished
        for finished in (datetime.fromisoformat(job["finished"]) for job in jobs
                         if job["system"] == system and job["status"] == "success")
        if start <= finished <= end
    )
    points = [start, *times, end]
    return max(int((later - earlier).total_seconds() // 60) for earlier, later in zip(points, points[1:]))


def restore_findings(tests, system, rto_minutes, today):
    """Return no-test, or stale/slow/unverified findings for the system's latest restore test."""
    mine = [test for test in tests if test["system"] == system]
    if not mine:
        return ["no-test"]
    latest = mine[0]
    for test in mine[1:]:
        if date.fromisoformat(test["date"]) >= date.fromisoformat(latest["date"]):
            latest = test
    findings = []
    if (today - date.fromisoformat(latest["date"])).days > TEST_INTERVAL_DAYS:
        findings.append(f"stale {latest['date']}")
    if int(latest["minutes"]) > rto_minutes:
        findings.append(f"slow {int(latest['minutes'])}")
    if latest["verified"] != "yes":
        findings.append("unverified")
    return findings
