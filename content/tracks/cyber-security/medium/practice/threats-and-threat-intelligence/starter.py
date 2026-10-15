"""Triage the merged threat feed before it is loaded into the shared SIEM."""
import csv

LEVELS = ["low", "medium", "high"]
RISK_ORDER = ["critical", "high", "medium", "low"]
SHAREABLE = {"TLP:CLEAR", "TLP:GREEN", "TLP:AMBER"}


def risk(likelihood, impact):
    """Return the risk level for a likelihood and an impact rated low, medium or high."""
    # YOUR CODE: the lesson's likelihood and impact matrix, ignoring case and spaces.
    # Raise ValueError for any rating other than low, medium or high.
    raise NotImplementedError


def triage(path, today):
    """Return the valid, shareable indicators of the feed at PATH, merged and ranked."""
    # YOUR CODE:
    # 1. Read the CSV, skipping blank lines and lines that start with "#".
    # 2. Drop rows that expired before TODAY and rows whose TLP is not in SHAREABLE.
    # 3. Merge rows with the same type and value (ignoring case): keep the most confident
    #    row, and collect the sources of all of them.
    # 4. Return dicts with type, value, risk, confidence and sources, ranked.
    raise NotImplementedError
