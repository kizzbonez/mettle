import numpy as np
import pandas as pd

visits = pd.DataFrame(
    {
        "card": ["C1", None, "C3", None],
        "minutes": [30.0, np.nan, np.nan, np.nan],
        "wifi": [True, False, True, True],
        "room": [np.nan, np.nan, np.nan, np.nan],
    }
)
before = visits.copy()
result = missing_counts(visits)
assert isinstance(result, pd.Series), "missing_counts returns a Series"
check_frame(
    result,
    pd.Series([2, 3, 0, 4], index=["card", "minutes", "wifi", "room"]),
    "missing_counts counts the gaps of every column, text columns and a column of only gaps included",
)
check_frame(visits, before, "missing_counts does not change the frame")

full = pd.DataFrame({"zeta": [1, 2], "alpha": ["a", "b"]})
check_frame(
    missing_counts(full),
    pd.Series([0, 0], index=["zeta", "alpha"]),
    "a frame without gaps gives 0 for every column, in column order",
)

empty = pd.DataFrame({"card": [], "minutes": []})
check_frame(missing_counts(empty), pd.Series([0, 0], index=["card", "minutes"]), "a frame without rows has no gaps")
