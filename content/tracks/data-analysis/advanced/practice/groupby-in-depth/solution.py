"""Allotment Harvests: per-plot summaries of the shed scale's harvest log."""

import pandas as pd


def plot_summary(harvests):
    """One row per plot: total_kg, heaviest_kg, pickings and weighed, with named aggregation."""
    summary = harvests.groupby("plot").agg(
        total_kg=("kg", "sum"),
        heaviest_kg=("kg", "max"),
        pickings=("kg", "size"),
        weighed=("kg", "count"),
    )
    return summary.assign(total_kg=summary["total_kg"].round(2))


def add_plot_columns(harvests):
    """A new frame with kg_filled, share and pick_no added; harvests is not changed."""
    by_plot = harvests.groupby("plot")
    filled = harvests["kg"].fillna(by_plot["kg"].transform("mean"))
    plot_total = filled.groupby(harvests["plot"]).transform("sum")
    return harvests.assign(
        kg_filled=filled,
        share=(filled / plot_total).round(3),
        pick_no=by_plot.cumcount() + 1,
    )


def regular_plots(harvests, min_pickings):
    """Every row of the plots with at least min_pickings rows, in their original order."""
    pickings = harvests.groupby("plot")["plot"].transform("size")
    return harvests[pickings >= min_pickings]
