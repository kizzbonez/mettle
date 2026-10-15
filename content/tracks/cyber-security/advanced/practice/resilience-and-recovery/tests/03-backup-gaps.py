# backup_gap: other systems and statuses ignored, unsorted logs, window edges and empty windows.
from datetime import datetime


def job(system, finished, status="success"):
    return {"system": system, "finished": finished, "status": status}


jobs = [
    job("orders", "2027-02-01T03:00:00"),
    job("orders", "2027-02-01T01:00:00"),
    job("orders", "2027-02-01T02:00:00", "failed"),
    job("orders", "2027-02-01T05:30:00", "Success"),
    job("orders", "2027-02-01T06:00:00", "partial"),
    job("invoices", "2027-02-01T04:00:00"),
    job("orders", "2027-01-31T23:00:00"),
    job("orders", "2027-02-01T08:00:00"),
]
start, end = datetime(2027, 2, 1, 0, 0), datetime(2027, 2, 1, 8, 0)
assert backup_gap(jobs, "orders", start, end) == 300, (
    "backup_gap with an unsorted log, other systems, failed, partial and differently written statuses, "
    "a backup before the window and one at its end"
)
assert backup_gap(jobs, "invoices", start, end) == 240, "backup_gap for a system with one backup in the middle"
assert backup_gap(jobs, "payroll", start, end) == 480, "backup_gap for a system with no backups: the whole window"
assert backup_gap([], "orders", datetime(2027, 2, 1, 0, 0), datetime(2027, 2, 2, 0, 0)) == 1440, (
    "backup_gap with an empty log over a day"
)

edges = [job("db", "2027-03-01T00:00:00"), job("db", "2027-03-01T00:59:59"), job("db", "2027-03-01T02:00:00")]
assert backup_gap(edges, "db", datetime(2027, 3, 1, 0, 0), datetime(2027, 3, 1, 2, 0)) == 60, (
    "backups exactly at the start and the end of the window count, and minutes are rounded down"
)
seconds = [job("db", "2027-03-01T00:00:30"), job("db", "2027-03-01T00:15:29")]
assert backup_gap(seconds, "db", datetime(2027, 3, 1, 0, 0), datetime(2027, 3, 1, 0, 30)) == 14, (
    "gaps of 14 min 59 s and 14 min 31 s are 14 whole minutes"
)
