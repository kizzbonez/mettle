import numpy as np
import pandas as pd

log = pd.DataFrame(
    {
        "plot": ["Z9", "M2", "Z9", "M2", "A1", "Z9"],
        "crop": ["kale", "chard", "kale", "chard", "garlic", "kale"],
        "kg": [np.nan, 0.75, np.nan, 1.5, 0.3, np.nan],
    },
    index=["r1", "r2", "r3", "r4", "r5", "r6"],
)
before = log.copy()
result = plot_summary(log)
assert isinstance(result, pd.DataFrame), "plot_summary returns a DataFrame"
assert result.columns.tolist() == ["total_kg", "heaviest_kg", "pickings", "weighed"], "plot_summary has the four columns in order"
assert result.index.name == "plot", "the index of plot_summary is named plot"
assert result.index.tolist() == ["A1", "M2", "Z9"], "plot_summary has one row per plot, sorted by plot"
expected = pd.DataFrame(
    {
        "total_kg": [0.3, 2.25, 0.0],
        "heaviest_kg": [0.3, 1.5, np.nan],
        "pickings": [1, 2, 3],
        "weighed": [1, 2, 0],
    },
    index=pd.Index(["A1", "M2", "Z9"], name="plot"),
)
check_frame(
    result,
    expected,
    "plot_summary counts every picking, counts only weighed ones in weighed, and gives a plot with nothing weighed a total of 0",
)
check_frame(log, before, "plot_summary does not change the harvest log")

rounding = pd.DataFrame({"plot": ["B7", "B7", "B7"], "crop": ["peas"] * 3, "kg": [0.1, 0.2, 0.004]})
check_frame(
    plot_summary(rounding),
    pd.DataFrame(
        {"total_kg": [0.3], "heaviest_kg": [0.2], "pickings": [3], "weighed": [3]},
        index=pd.Index(["B7"], name="plot"),
    ),
    "total_kg is rounded to 2 decimals",
    check_exact=True,
)
