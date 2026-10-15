"""Veg Box Files: save, reload and export the vegetable box deliveries.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import pandas as pd

SIZE = pd.CategoricalDtype(["small", "medium", "large"], ordered=True)


def save(deliveries, path):
    """A plain CSV with box_id as its first column."""
    raise NotImplementedError


def load(path):
    """Read a file written by save back to an equal frame."""
    # A CSV keeps only text: restore the index and every dtype.
    raise NotImplementedError


def write_spreadsheet(deliveries, path):
    """';' fields, decimal comma, two-decimal weights, DD/MM/YYYY dates, UTF-8 with a BOM."""
    raise NotImplementedError


def write_feed(deliveries, path):
    """JSON Lines, one record per box with its box_id, ISO dates."""
    raise NotImplementedError
