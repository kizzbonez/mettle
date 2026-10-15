import numpy as np
import pandas as pd

index = [17, 4, 9, 23, 1]
quantity = pd.Series([32_767, 120, -40, 1, 0], index=index, dtype="int16", name="quantity")
unit_pence = pd.Series([32_767, 275, 1_250, 32_767, 999], index=index, dtype="int16", name="unit_pence")
quantity_before = quantity.copy()
unit_before = unit_pence.copy()

check_frame(
    line_totals(quantity, unit_pence),
    pd.Series([1_073_676_289, 33_000, -50_000, 32_767, 0], index=index, name="total_pence"),
    "line_totals gives int64 totals far beyond the int16 range, refunds included, with the lines' index",
)
check_frame(quantity, quantity_before, "line_totals does not change the quantities or their int16 type")
check_frame(unit_pence, unit_before, "line_totals does not change the unit prices or their int16 type")

rng = np.random.default_rng(6)
many_quantity = pd.Series(rng.integers(1, 2_000, 10_000), dtype="int16")
many_unit = pd.Series(rng.integers(100, 30_000, 10_000), dtype="int16")
check_frame(
    line_totals(many_quantity, many_unit),
    (many_quantity.astype("int64") * many_unit.astype("int64")).rename("total_pence"),
    "line_totals gives exact totals for 10,000 lines",
)
