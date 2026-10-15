"""Ferry Line Vulnerability and Risk Report: prioritize scan findings and build the risk register summary.

Every `raise NotImplementedError` below marks code you still have to write.
Keep every function name and its parameters: the tests use them.
You may add helper functions.
"""

import json

import numpy as np
import pandas as pd

FINDING_COLUMNS = ["finding_id", "host", "port", "cve", "cvss", "first_seen", "owner", "criticality", "exposure"]
CRITICALITY_ORDER = ["critical", "high", "medium", "low"]
SLA_DAYS = {"P1": 7, "P2": 14, "P3": 30, "P4": 90}


def load_findings(scan_path, assets_path):
    """Return one row per distinct finding on an inventoried host, joined to the inventory.

    TODO 1: clean host names (both files) and CVE ids, drop rows without a CVE, keep the
    earliest row of each (host, port, cve), join owner, criticality and exposure from the
    inventory, keep FINDING_COLUMNS, sort by finding_id and renumber the rows.
    """
    raise NotImplementedError


def unknown_hosts(scan_path, assets_path):
    """Return the sorted list of clean host names in the scan that are not in the inventory.

    TODO 2: every row of the scan counts, with or without a CVE.
    """
    raise NotImplementedError


def prioritize(findings, kev_path, as_of):
    """Return a new DataFrame with kev, ransomware, priority, due, days_open and overdue added.

    TODO 3: read the KEV catalog (json), apply the priority rules in order, add the SLA days,
    compare with as_of, and sort by priority, criticality, cvss (highest first), finding_id.
    """
    raise NotImplementedError


def annual_loss(risks_path, losses_path, assets_path, as_of, years=5):
    """Return SLE, events, ARO and ALE for each stated risk, indexed by risk_id.

    TODO 4: count each risk's incidents in the window before as_of, fall back to the
    industry ARO when there are none, and compute SLE and ALE from the asset value.
    """
    raise NotImplementedError


def register_summary(losses_table, prioritized, appetite):
    """Return one row per risk with its ALE, findings on its host, appetite check and action.

    TODO 5: count findings per host, join them to the risks, apply the action rules and sort
    by ALE (highest first), then risk_id.
    """
    raise NotImplementedError
