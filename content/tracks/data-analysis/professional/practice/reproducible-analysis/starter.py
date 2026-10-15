"""Reading Challenge: a leaderboard and a prize draw that come out the same every time.

Every `raise NotImplementedError` marks code you still have to write.
Keep the function names and parameters: the tests call them.
"""

import json
import platform
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow

PRIZE_BOOKS = 10


def prize_draw(pupils, n, seed):
    """The names of N pupils with at least 10 books, drawn with a generator seeded with SEED."""
    # Create the generator here, from SEED, and pass it to sample: no global random state.
    raise NotImplementedError


def leaderboard(pupils):
    """Every pupil ranked by books, then minutes, then name, with hours instead of minutes."""
    raise NotImplementedError


def versions():
    """The versions of Python and the libraries the results were computed with."""
    raise NotImplementedError


def write_results(pupils, folder):
    """Write leaderboard.csv and versions.json into FOLDER, the same bytes on every run."""
    raise NotImplementedError
