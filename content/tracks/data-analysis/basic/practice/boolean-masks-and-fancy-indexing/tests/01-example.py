import numpy as np

minutes = np.array([12.5, 1.0, 45.0, 30.0, 200.0, 2.0, 181.5, 0.5])
before = minutes.copy()
check_array(fair_rides(minutes), [12.5, 45.0, 30.0, 2.0], "fair_rides of the example", strict=True)
check_array(fees(minutes), [1.5, 0.0, 4.0, 1.5, 4.0, 1.5, 4.0, 0.0], "fees of the example", strict=True)
late = overdue(minutes)
assert isinstance(late, np.ndarray) and late.dtype.kind in "iu", "overdue returns an integer array"
check_array(late, [4, 6], "overdue of the example")
check_array(minutes, before, "the example's minutes are not changed")
