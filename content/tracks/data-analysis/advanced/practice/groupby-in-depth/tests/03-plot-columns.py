import numpy as np
import pandas as pd

log = pd.DataFrame(
    {
        "plot": ["K1", "K2", "K1", "K2", "K1", "K3", "K2", "K3"],
        "crop": ["leeks", "beets", "leeks", "beets", "leeks", "herbs", "beets", "herbs"],
        "kg": [2.0, 10.0, np.nan, np.nan, 4.0, np.nan, 6.0, np.nan],
    },
    index=[70, 60, 50, 40, 30, 20, 10, 0],
)
before = log.copy()
result = add_plot_columns(log)
assert isinstance(result, pd.DataFrame), "add_plot_columns returns a DataFrame"
assert result.columns.tolist() == ["plot", "crop", "kg", "kg_filled", "share", "pick_no"], (
    "add_plot_columns keeps the log's columns and adds kg_filled, share and pick_no in that order"
)
check_frame(log, before, "add_plot_columns does not change the harvest log")
assert result.index.tolist() == [70, 60, 50, 40, 30, 20, 10, 0], "add_plot_columns keeps the rows and their index labels"

check_frame(
    result["kg_filled"],
    pd.Series([2.0, 10.0, 3.0, 8.0, 4.0, np.nan, 6.0, np.nan], index=log.index, name="kg_filled"),
    "kg_filled fills a gap with the mean of its own plot, and a plot with nothing weighed stays missing",
)
check_frame(
    result["share"],
    pd.Series([0.222, 0.417, 0.333, 0.333, 0.444, np.nan, 0.25, np.nan], index=log.index, name="share"),
    "share divides kg_filled by its plot's total of kg_filled, rounded to 3 decimals",
)
check_frame(
    result["pick_no"],
    pd.Series([1, 1, 2, 2, 3, 1, 3, 2], index=log.index, name="pick_no"),
    "pick_no numbers each plot's rows from 1, in the order of the log",
)

single = pd.DataFrame({"plot": ["Q5"], "crop": ["rhubarb"], "kg": [1.75]})
check_frame(
    add_plot_columns(single),
    single.assign(kg_filled=[1.75], share=[1.0], pick_no=[1]),
    "a log of one picking",
)
