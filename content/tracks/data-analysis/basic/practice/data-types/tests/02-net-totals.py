import numpy as np

first = np.array([[255, 128, 0], [200, 1, 99]], dtype=np.uint8)
second = np.array([[255, 128, 0], [100, 255, 157]], dtype=np.uint8)
before = (first.copy(), second.copy())
totals = net_totals(first, second)
assert isinstance(totals, np.ndarray) and totals.dtype == np.int64, "net_totals returns int64 for two-dimensional counts"
check_array(totals, np.array([[510, 256, 0], [300, 256, 256]]), "net_totals adds every spot without wrapping past 255", strict=True)
check_array(first, before[0], "net_totals does not change the first array", strict=True)
check_array(second, before[1], "net_totals does not change the second array", strict=True)

quiet = net_totals(np.zeros(3, dtype=np.uint8), np.zeros(3, dtype=np.uint8))
check_array(quiet, np.zeros(3, dtype=np.int64), "net_totals of empty nets is zeros as int64", strict=True)

small = net_totals(np.array([3], dtype=np.uint8), np.array([4], dtype=np.uint8))
check_array(small, np.array([7]), "net_totals of one spot", strict=True)
