"""Check a SaaS provider's month against its SLA and score the bids for its replacement."""
import csv
from datetime import datetime


def read_rows(path):
    """Return the rows of the CSV file at PATH as dictionaries (blank lines are skipped)."""
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def availability(outages_path, days):
    """Percent of the month's minutes the service was available, to 3 decimals."""
    # YOUR CODE: skip maintenance announced 5 or more business days ahead; sum the rest.
    raise NotImplementedError


def service_credit(percent):
    """The service credit, in percent of the monthly fee, from clause 2.2."""
    # YOUR CODE: 0, 10, 25 or 50.
    raise NotImplementedError


def rank_bids(scores_path, conflicts_path, weights):
    """Return (bidder, total) tuples, best first, without conflicted evaluators' scores."""
    # YOUR CODE: drop each evaluator's scores for the bidders they declared a conflict with,
    # average each bidder's criterion scores, weight them, round to 2 decimals and sort.
    raise NotImplementedError
