"""Swimming Gala: the timekeeper's arrays, made with NumPy's creation functions."""

import numpy as np


def results_board(heats, lanes):
    """A float64 array of shape (heats, lanes) holding -1.0 everywhere."""
    return np.full((heats, lanes), -1.0)


def lane_numbers(lanes):
    """The lane numbers 1, 2, ..., lanes, both ends included."""
    return np.arange(1, lanes + 1)


def heat_starts(session_minutes, heats):
    """heats evenly spaced start times from 0, the end of the session not included."""
    return np.linspace(0, session_minutes, heats, endpoint=False)


def as_times(times):
    """times as a float64 array; a float64 array is returned as it is, not copied."""
    return np.asarray(times, dtype=np.float64)
