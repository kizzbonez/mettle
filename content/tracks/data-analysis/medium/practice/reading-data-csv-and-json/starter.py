"""Club Rides: read the cycling club's three files with the right options.

Every `raise NotImplementedError` marks code you still have to write: one
pd.read_csv or pd.read_json call each. Keep the function names and parameters.
"""

import pandas as pd


def read_rides(path):
    """The rides export: ';' fields, decimal commas, dotted thousands, DD.MM.YYYY dates, '-' missing."""
    # Two lines of notes come before the header. Keep five columns; rider stays text.
    raise NotImplementedError


def read_members(path):
    """The member list without a header, indexed by member number as text."""
    # Name the columns member, name and group.
    raise NotImplementedError


def read_checks(path):
    """The workshop's bike checks, one JSON object per line."""
    raise NotImplementedError
