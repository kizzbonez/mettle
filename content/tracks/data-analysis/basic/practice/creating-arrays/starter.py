"""Swimming Gala: the timekeeper's arrays, made with NumPy's creation functions.

Every `raise NotImplementedError` marks code you still have to write: one line
each, with the function the comment names. Keep the names and parameters.
"""

import numpy as np


def results_board(heats, lanes):
    """A float64 array of shape (heats, lanes) holding -1.0 everywhere."""
    # TODO: np.full, with a fill value that makes the array float64.
    raise NotImplementedError


def lane_numbers(lanes):
    """The lane numbers 1, 2, ..., lanes, both ends included."""
    # TODO: np.arange. Its stop value is left out.
    raise NotImplementedError


def heat_starts(session_minutes, heats):
    """heats evenly spaced start times from 0, the end of the session not included."""
    # TODO: np.linspace with a count, not np.arange with a fractional step.
    raise NotImplementedError


def as_times(times):
    """times as a float64 array; a float64 array is returned as it is, not copied."""
    # TODO: np.asarray with dtype=.
    raise NotImplementedError
