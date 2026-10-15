"""Allotment Harvests: per-plot summaries of the shed scale's harvest log.

harvests has the columns plot, crop and kg (kg is missing when a picking was not weighed).
Every `raise NotImplementedError` marks code you still have to write. Use groupby with
named aggregation, transform and size or cumcount: no loops over rows or plots.
"""

import pandas as pd


def plot_summary(harvests):
    """One row per plot: total_kg, heaviest_kg, pickings and weighed, with named aggregation."""
    raise NotImplementedError


def add_plot_columns(harvests):
    """A new frame with kg_filled, share and pick_no added; harvests is not changed."""
    # transform puts a plot's value on every one of its rows.
    raise NotImplementedError


def regular_plots(harvests, min_pickings):
    """Every row of the plots with at least min_pickings rows, in their original order."""
    raise NotImplementedError
