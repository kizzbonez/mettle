import numpy as np
import pandas as pd

plots = pd.DataFrame(
    {
        "plot": ["M1", "M2", "M3", "M4", "M5"],
        "holder": ["Ana", "Ben", "Cai", "Dina", "Eve"],
        "size_m2": [60, 125, 250, 60, 125],
        "rent": [18.0, 32.5, 60.0, 18.0, 32.5],
        "paid": [False, True, False, False, True],
    },
    index=[9, 7, 5, 3, 1],
)
before = plots.copy()

late = late_list(plots, 2.5)
check_frame(plots, before, "late_list leaves plots unchanged: no rent raised, no column added")
check_frame(
    late,
    pd.DataFrame(
        {
            "plot": ["M1", "M3", "M4"],
            "holder": ["Ana", "Cai", "Dina"],
            "size_m2": [60, 250, 60],
            "rent": [20.5, 62.5, 20.5],
            "paid": [False, False, False],
        },
        index=[9, 5, 3],
    ),
    "late_list gives the unpaid plots in their order with their labels, and the fee added to their rent",
)
everyone_paid = plots.assign(paid=True)
none_late = late_list(everyone_paid, 2.5)
assert len(none_late) == 0 and list(none_late.columns) == list(plots.columns), (
    "when every plot is paid, late_list gives an empty frame with the same columns"
)

rents = rent_array(plots)
assert isinstance(rents, np.ndarray) and rents.dtype == np.float64, "rent_array returns a float64 NumPy array"
check_array(rents, np.array([18.0, 32.5, 60.0, 18.0, 32.5]), "rent_array holds the rents in row order")
try:
    rents[:] = 0.0
except ValueError:
    raise AssertionError("the caller can write to the array rent_array returns") from None
check_frame(plots, before, "writing to the array from rent_array does not change plots")
assert not np.shares_memory(rent_array(plots), plots["rent"].to_numpy()), (
    "rent_array returns an array of its own, not the column's memory"
)
