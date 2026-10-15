import numpy as np

first = np.array([12, 250, 0, 31], dtype=np.uint8)
second = np.array([9, 10, 4, 0], dtype=np.uint8)
totals = net_totals(first, second)
assert isinstance(totals, np.ndarray) and totals.dtype == np.int64, "net_totals returns an int64 array"
check_array(totals, np.array([21, 260, 4, 31]), "net_totals of the example nets", strict=True)

depths = whole_cm(np.array([12.4, 30.5, 7.5, 18.9]))
assert isinstance(depths, np.ndarray) and depths.dtype == np.int64, "whole_cm returns an int64 array"
check_array(depths, np.array([12, 30, 8, 19]), "whole_cm of the example depths", strict=True)

assert missing_temps(np.array([14.5, np.nan, 13.9, np.nan])) == 2, "missing_temps of the example temperatures"
