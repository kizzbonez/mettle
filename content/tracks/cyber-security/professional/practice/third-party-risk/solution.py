"""Check a SaaS provider's month against its SLA and score the bids for its replacement."""
import csv
from datetime import datetime


def read_rows(path):
    """Return the rows of the CSV file at PATH as dictionaries (blank lines are skipped)."""
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def availability(outages_path, days):
    """Percent of the month's minutes the service was available, to 3 decimals."""
    month = days * 24 * 60
    downtime = 0.0
    for row in read_rows(outages_path):
        notice = int(row["notice_days"]) if row["notice_days"].strip() else 0
        if row["kind"] == "maintenance" and notice >= 5:
            continue
        start = datetime.fromisoformat(row["start"])
        end = datetime.fromisoformat(row["end"])
        downtime += (end - start).total_seconds() / 60
    return round(100 * (month - downtime) / month, 3)


def service_credit(percent):
    """The service credit, in percent of the monthly fee, from clause 2.2."""
    if percent >= 99.9:
        return 0
    if percent >= 99.0:
        return 10
    if percent >= 95.0:
        return 25
    return 50


def rank_bids(scores_path, conflicts_path, weights):
    """Return (bidder, total) tuples, best first, without conflicted evaluators' scores."""
    conflicts = {(row["evaluator"].strip(), row["bidder"].strip()) for row in read_rows(conflicts_path)}
    scores = {}
    for row in read_rows(scores_path):
        evaluator, bidder = row["evaluator"].strip(), row["bidder"].strip()
        if (evaluator, bidder) in conflicts:
            continue
        scores.setdefault(bidder, {}).setdefault(row["criterion"].strip(), []).append(float(row["score"]))
    totals = []
    for bidder, criteria in scores.items():
        total = sum(weights[c] * sum(values) / len(values) for c, values in criteria.items())
        totals.append((bidder, round(total, 2)))
    return sorted(totals, key=lambda pair: (-pair[1], pair[0]))
