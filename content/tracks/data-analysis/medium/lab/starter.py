"""Ashby charging report: clean the chargers' session exports and summarise them per site.

Every `raise NotImplementedError` below marks code you still have to write.
Keep every function name and its parameters: the tests use them.
You may add helper functions and constants.
"""

import pandas as pd


def load_sessions(path):
    """Read one sessions export into a clean DataFrame (see the instructions for each column)."""
    # TODO 1: read_csv with the right options, then fix site, connector and minutes.
    raise NotImplementedError


def load_prices(path):
    """Read the sites JSON file into a Series of prices per kWh, indexed by site code."""
    # TODO 2
    raise NotImplementedError


def add_cost(sessions, prices):
    """Return a new DataFrame: sessions plus a cost column. Do not change `sessions`."""
    # TODO 3
    raise NotImplementedError


def completed_in_period(sessions, start, end):
    """Return the sessions with status ok started from start to end, both included."""
    # TODO 4
    raise NotImplementedError


def site_summary(sessions):
    """Return one row per site with sessions, energy_kwh, revenue, avg_minutes and faults."""
    # TODO 5: groupby with named aggregation, round, sort.
    raise NotImplementedError
