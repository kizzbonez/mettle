"""Brightwater village hall solar panels: load, clean and summarise the logger's daily readings."""

import numpy as np


def load_energy(path):
    """Return the file's energy array: one row per day, one column per string, NaN for gaps."""
    table = np.genfromtxt(path, delimiter=",", skip_header=1)
    return table[:, 1:]


def clean(energy, capacity):
    """Return a new array with readings below 0 or above capacity replaced by NaN."""
    cleaned = energy.copy()
    cleaned[(cleaned < 0) | (cleaned > capacity)] = np.nan
    return cleaned


def daily_totals(energy):
    """Return each day's total, ignoring NaN, rounded to 2 places; NaN for a day with no readings."""
    totals = np.nansum(energy, axis=1)
    no_readings = np.isnan(energy).all(axis=1)
    return np.round(np.where(no_readings, np.nan, totals), 2)


def relative_output(energy):
    """Return each reading divided by its day's median, rounded to 3 places."""
    medians = np.nanmedian(energy, axis=1, keepdims=True)
    with np.errstate(divide="ignore", invalid="ignore"):
        ratios = energy / medians
    return np.round(np.where(medians > 0, ratios, np.nan), 3)


def underperformers(energy, threshold=0.8):
    """Return the ascending column positions of strings whose median relative output is below threshold."""
    typical = np.nanmedian(relative_output(energy), axis=0)
    return np.nonzero(typical < threshold)[0]


def spot_check_days(energy, k, seed):
    """Return k different days (row positions, ascending) drawn from the days with any reading."""
    rng = np.random.default_rng(seed)
    candidates = np.nonzero(~np.isnan(energy).all(axis=1))[0]
    return np.sort(rng.choice(candidates, size=k, replace=False))
