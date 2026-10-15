import numpy as np
import pandas as pd

log = pd.DataFrame(
    {
        "plot": ["P1", "P2", "P3", "P2", "P1", "P2", "P3", "P4"],
        "crop": ["corn", "peas", "kale", "peas", "corn", "peas", "kale", "mint"],
        "kg": [1.0, np.nan, 2.0, np.nan, 3.0, 0.5, 1.5, np.nan],
    },
    index=["a", "b", "c", "d", "e", "f", "g", "h"],
)
before = log.copy()

kept = regular_plots(log, 3)
assert isinstance(kept, pd.DataFrame), "regular_plots returns a DataFrame"
check_frame(kept, log.loc[["b", "d", "f"]], "regular_plots counts every picking of a plot, weighed or not")

check_frame(
    regular_plots(log, 2),
    log.loc[["a", "b", "c", "d", "e", "f", "g"]],
    "regular_plots keeps a plot with exactly min_pickings rows, with the rows in their original order and labels",
)
check_frame(regular_plots(log, 1), log, "with min_pickings 1 every row is kept")

none = regular_plots(log, 4)
assert isinstance(none, pd.DataFrame) and len(none) == 0, "when no plot has enough pickings the result has no rows"
assert none.columns.tolist() == ["plot", "crop", "kg"], "an empty result still has the log's columns"
check_frame(log, before, "regular_plots does not change the harvest log")
