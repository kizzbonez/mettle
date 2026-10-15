"""Profile the council's incidents by threat actor type, from the attributes in the register."""
import csv
from collections import Counter


def classify(incident):
    """Return the threat actor type for one incident (a dict of the register's columns)."""
    # YOUR CODE: apply the eight rules from the instructions in order; the first that matches
    # wins. Compare values ignoring case and surrounding spaces.
    raise NotImplementedError


def is_apt(incident):
    """Return True when the incident shows an advanced persistent threat."""
    # YOUR CODE: external, well resourced, sophisticated and persistent (dwell_days >= 90).
    raise NotImplementedError


def landscape(path):
    """Summarize the register at PATH: actors, internal and external counts, and APT incidents."""
    # YOUR CODE: csv.DictReader, classify, is_apt and a Counter.
    raise NotImplementedError
