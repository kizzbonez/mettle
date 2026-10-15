"""Apply data subject requests while honoring legal holds and retention requirements."""
import calendar
import csv
import json
from datetime import date


def read_rows(path):
    """Return the rows of the CSV file at PATH as dictionaries (blank lines are skipped)."""
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def due_date(received):
    """One month after RECEIVED, clamped to the last day of the month."""
    # YOUR CODE: the next month (December goes to January of the next year), and
    # calendar.monthrange(year, month)[1] days at most.
    raise NotImplementedError


def apply_requests(members_path, invoices_path, holds_path, requests_path, as_of):
    """Return (members by id, outcome strings) after applying the requests."""
    # YOUR CODE:
    #   members: {id: record} from the JSON list
    #   held: member ids in holds whose "released" is None
    #   retained: members with an invoice dated on or after as_of minus 7 years
    #   then apply the requests sorted by (received, request) as the table says.
    raise NotImplementedError
