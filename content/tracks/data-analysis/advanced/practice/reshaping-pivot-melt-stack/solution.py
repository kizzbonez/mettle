"""Running Club Log: reshape the club's distance sheets and kit orders."""

import pandas as pd


def sheet_to_long(sheet):
    """One row per reported distance: runner, week, km, sorted by runner then week."""
    long = sheet.melt(id_vars="runner", var_name="week", value_name="km").dropna(subset=["km"])
    return long.sort_values(["runner", "week"]).reset_index(drop=True)


def weekly_totals(runs):
    """Total km per runner (rows) and week (columns), 0 where none, with All totals."""
    table = runs.pivot_table(
        index="runner",
        columns="week",
        values="km",
        aggfunc="sum",
        fill_value=0,
        margins=True,
    )
    return table.round(1)


def kit_table(orders):
    """How often each kit item was ordered in each size."""
    items = orders.explode("kit", ignore_index=True)
    return pd.crosstab(items["kit"], items["size"])
