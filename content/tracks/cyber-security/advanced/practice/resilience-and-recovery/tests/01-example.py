# The example from the instructions.
import csv
import math
from datetime import date, datetime

with open("data/backup-jobs.csv", newline="") as handle:
    jobs = list(csv.DictReader(handle))
with open("data/restore-tests.csv", newline="") as handle:
    tests = list(csv.DictReader(handle))

got = availability(2190, 6)
assert math.isclose(got, 2190 / 2196, rel_tol=1e-12), f"availability(2190, 6), got {got!r}"
got = availability(2190, 6, nodes=2)
assert math.isclose(got, 1 - (6 / 2196) ** 2, rel_tol=1e-12), f"availability(2190, 6, nodes=2), got {got!r}"

got = backup_gap(jobs, "dispatch", datetime(2026, 11, 2, 0, 0), datetime(2026, 11, 2, 6, 0))
assert got == 121, f"backup_gap for dispatch on 2 November from 00:00 to 06:00, got {got!r}"
got = backup_gap(jobs, "payroll", datetime(2026, 11, 1, 0, 0), datetime(2026, 11, 3, 0, 0))
assert got == 2777, f"backup_gap for payroll from 1 to 3 November, got {got!r}"

for system, rto, expected in [("dispatch", 60, ["slow 74"]), ("payroll", 4320, ["stale 2026-03-30"]),
                              ("tracking", 120, ["unverified"]), ("billing", 240, ["no-test"])]:
    got = restore_findings(tests, system, rto, date(2026, 11, 2))
    assert got == expected, f"restore_findings for {system} with an RTO of {rto} minutes, got {got!r}"
