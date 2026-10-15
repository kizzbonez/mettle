import numpy as np
import pandas as pd

prices = pd.Series(["2.675", "0.125", "1.10", "3", "-1.005"], name="price")
check_frame(
    to_pence(prices),
    pd.Series([268, 13, 110, 300, -101], name="price"),
    "to_pence turns the example prices into whole pence, halves away from zero",
)

quantity = pd.Series([300, 12, 150], dtype="int16")
unit_pence = pd.Series([250, 1999, 300], dtype="int16")
check_frame(
    line_totals(quantity, unit_pence),
    pd.Series([75000, 23988, 45000], name="total_pence"),
    "line_totals multiplies the example lines without wrapping around",
)

till = pd.Series([10.10, 0.1 + 0.2, 1000.00, 20.004, np.nan])
bank = pd.Series([10.10, 0.30, 1000.01, 20.006, 5.00])
check_frame(
    reconcile(till, bank),
    pd.Series([True, True, False, True, False], name="matches"),
    "reconcile matches the example amounts to within half a penny",
)
