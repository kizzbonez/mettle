Write three functions in `solution.py`. The CSV rows are the dicts `csv.DictReader` gives (all
values are strings). Never read the clock: every date and time is passed in.

1. `availability(mtbf, mttr, nodes=1)` returns the availability (a `float` from 0 to 1) of a
   service run on `nodes` independent, identical nodes, any one of which can carry the load. One
   node's availability is `a = mtbf / (mtbf + mttr)`; the service is down only when all nodes
   are, so it is `1 - (1 - a) ** nodes`.
2. `backup_gap(jobs, system, start, end)` returns the worst-case data loss, in whole minutes
   rounded down, for `system` during the window from `start` to `end` (two `datetime`s). Use only
   the jobs of that system whose `status` is `success` and whose `finished` time (ISO, like
   `2026-11-02T00:05:12`) is within the window, ends included; the log is not always in time
   order. The answer is the longest of the gaps between `start`, each of those finish times in
   order, and `end`. With no successful job, it is the whole window.
3. `restore_findings(tests, system, rto_minutes, today)` checks the restoration tests of
   `system` (rows `system,date,minutes,verified`) on `today` (a `date`) and returns a list:
   - `["no-test"]` when the system has no test at all;
   - otherwise take its **latest** test (the latest `date`; for equal dates, the later row) and
     give, in this order: `stale <date>` when it is more than `TEST_INTERVAL_DAYS` (90) days
     before `today`; `slow <minutes>` when its `minutes` is more than `rto_minutes`;
     `unverified` when its `verified` is not `yes`.

**Example.** With the files in `data/`:

```python
availability(2190, 6)               # 0.99726775956...   one node, about 24 hours down a year
availability(2190, 6, nodes=2)      # 0.99999253...      two nodes
backup_gap(jobs, "dispatch", datetime(2026, 11, 2, 0, 0), datetime(2026, 11, 2, 6, 0))   # 121
backup_gap(jobs, "payroll", datetime(2026, 11, 1, 0, 0), datetime(2026, 11, 3, 0, 0))    # 2777
restore_findings(tests, "dispatch", 60, date(2026, 11, 2))      # ['slow 74']
restore_findings(tests, "payroll", 4320, date(2026, 11, 2))     # ['stale 2026-03-30']
restore_findings(tests, "tracking", 120, date(2026, 11, 2))     # ['unverified']
restore_findings(tests, "billing", 240, date(2026, 11, 2))      # ['no-test']
```

The 03:05 dispatch backup failed, so between the good backups at 02:05:03 and 04:06:30 two hours
and a minute of jobs were at risk: dispatch misses its one-hour RPO. Payroll's 2 November backup
was only `partial`, so the last good one was early on 1 November.

**Tips.** `datetime.fromisoformat()` reads the times; `(later - earlier).total_seconds() // 60`
gives whole minutes; ISO dates sort correctly as text, or compare `date` objects.
