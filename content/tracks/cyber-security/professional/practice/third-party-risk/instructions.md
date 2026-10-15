Write three functions in `solution.py`. The starter gives `read_rows(path)`, which returns a CSV
file's rows as dictionaries (blank lines are skipped).

1. `availability(outages_path, days)` returns the month's availability in percent, rounded to
   3 decimals. The month has `days` days of `24 × 60` minutes. The outages file has the columns
   `start,end,kind,notice_days`, with times in UTC (`2026-10-09T14:12:00Z`). Each outage's
   downtime is the minutes from `start` to `end` (seconds count as fractions of a minute). As
   the SLA says, an outage whose `kind` is `maintenance` and whose `notice_days` (business days
   of notice) is 5 or more is excluded; every other outage counts, short-notice maintenance
   included. Availability = 100 × (month minutes − downtime) / month minutes.
2. `service_credit(percent)` returns the credit in percent of the monthly fee, from clause 2.2
   of the contract: `0` at 99.9 or more; `10` from 99.0 up to, not including, 99.9; `25` from
   95.0 up to, not including, 99.0; `50` below 95.0.
3. `rank_bids(scores_path, conflicts_path, weights)` scores the bids for the replacement. The
   scores file has `evaluator,bidder,criterion,score` (0 to 5), the conflicts file
   `evaluator,bidder`: an evaluator who declared a conflict of interest with a bidder steps out,
   so **none** of that evaluator's scores for **that** bidder count (their scores for other
   bidders still do). For each bidder, average the remaining scores of each criterion; the
   total is the sum of `weights[criterion] × average`, rounded to 2 decimals. Return a list of
   `(bidder, total)` tuples sorted by total, highest first, then by bidder name.

**Example.**

```python
availability("data/outages-2026-10.csv", 31)          # 99.711
service_credit(99.711)                                # 10
rank_bids("data/rfp-scores.csv", "data/conflicts.csv",
          {"security": 0.5, "functionality": 0.3, "price": 0.2})
# [('Kestrel Ticketing', 3.97), ('Turnstile Cloud', 3.57), ('Gatehouse Systems', 3.55)]
```

October has 44,640 minutes. The maintenance on the 3rd was announced 7 business days ahead
and is excluded, but the one on the 24th was announced only 2 days ahead, so 38 + 61 + 30 = 129
minutes count: 99.711 %, a 10 % credit. B. Okoro used to work for Gatehouse Systems; with
Okoro's generous scores, Gatehouse would have come first with 4.03.

**Tips:** `datetime.fromisoformat` reads the times, and `(end - start).total_seconds() / 60`
gives minutes. A dictionary keyed by `(bidder, criterion)` can collect lists of scores, and
`sorted(..., key=lambda pair: (-pair[1], pair[0]))` orders the result.
