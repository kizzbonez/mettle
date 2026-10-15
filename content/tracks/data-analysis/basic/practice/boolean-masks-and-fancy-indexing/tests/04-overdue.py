import numpy as np

minutes = np.array([181.0, 180.0, 12.0, 500.0, 179.9, 240.0, 1.0, 180.5])
before = minutes.copy()
late = overdue(minutes)
assert isinstance(late, np.ndarray) and late.dtype.kind in "iu" and late.ndim == 1, (
    "overdue returns a one-dimensional integer array of positions"
)
check_array(late, [0, 3, 5, 7], "overdue lists the positions of hires longer than 180 minutes, ascending, not 180 itself")
check_array(minutes, before, "overdue does not change minutes")

none = overdue(np.array([10.0, 180.0, 2.0]))
assert isinstance(none, np.ndarray) and none.shape == (0,) and none.dtype.kind in "iu", (
    "overdue returns an empty integer array when no hire is overdue"
)
check_array(overdue(np.array([999.0])), [0], "a single overdue hire is at position 0")
check_array(overdue(np.array([200.0, 300.0, 400.0])), [0, 1, 2], "every hire overdue")
