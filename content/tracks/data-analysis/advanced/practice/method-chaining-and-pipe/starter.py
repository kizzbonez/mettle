"""Food Bank Donations: one readable chain from the volunteers' file to the weekly table.

Every `raise NotImplementedError` marks code you still have to write. report must be one
chain: a single return statement, one step per line, with pipe for your own steps.
"""

import pandas as pd


def tidy_names(df):
    """The same frame with every column name tidied: ' Weight (g) ' becomes 'weight_g'."""
    raise NotImplementedError


def drop_small(df, min_kg):
    """The rows whose kg is at least min_kg."""
    raise NotImplementedError


def report(path, min_kg):
    """Donations and total kg per item type, heaviest first."""
    # return (
    #     pd.read_csv(path)
    #     .pipe(tidy_names)
    #     ...
    # )
    raise NotImplementedError
