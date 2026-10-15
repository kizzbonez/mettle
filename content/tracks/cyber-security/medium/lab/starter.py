"""Larkfield Dental investigation: find and classify the indicators in one day of logs.

Every `raise NotImplementedError` below marks code you still have to write.
Keep every function name and its parameters: the tests use them.
You may add helper functions and constants.
"""

import csv
import re
from collections import Counter, defaultdict
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from urllib.parse import unquote_plus


def km_between(lat1, lon1, lat2, lon2):
    """Great-circle distance in km (haversine formula, Earth radius 6371.0 km). Already done."""
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * 6371.0 * asin(sqrt(a))


def ssh_attacks(path):
    """Classify SSH source IPs as brute-force or password-spraying (instructions, step 1)."""
    # TODO 1: count failures per IP and user, collect accepted users, apply the rules, sort.
    raise NotImplementedError


def impossible_travel(path, max_kmh=900, min_km=500):
    """Flag consecutive successful sign-ins too far apart for the time between them (step 2)."""
    # TODO 2
    raise NotImplementedError


def web_probes(path):
    """Requests whose target, decoded twice, shows traversal or injection (step 3)."""
    # TODO 3
    raise NotImplementedError


def ioc_matches(processes_path, iocs_path):
    """Processes that match the IoC list by hash, domain or IPv4 (step 4)."""
    # TODO 4
    raise NotImplementedError


def report(data_dir):
    """The investigation summary, one finding per line (step 5)."""
    # TODO 5
    raise NotImplementedError


if __name__ == "__main__":
    print("\n".join(report("data")))
