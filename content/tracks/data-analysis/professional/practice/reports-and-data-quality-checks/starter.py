"""Museum Visitors: the weekly visitor report, with checks against last week.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

from pathlib import Path

import pandas as pd


def visitor_table(visits):
    """Visitors per museum and ticket type, with a Total row and a Total column."""
    raise NotImplementedError


def render(table):
    """The table as text: counts with thousands separators and each museum's share of the total."""
    # Format only here, at the end, with to_string(formatters=...).
    raise NotImplementedError


def batch_warnings(previous, current, max_change=0.2, max_null_rise=0.05):
    """Compare this week's visits with last week's and return a list of warnings."""
    raise NotImplementedError


def write_report(path, previous, current):
    """Write the week's table and the data checks to PATH as UTF-8 text."""
    raise NotImplementedError
