import numpy as np

minutes = np.array([1.99, 2.0, 30.0, 30.01, 0.0, 600.0, 15.0, 31.0])
before = minutes.copy()
charged = fees(minutes)
assert isinstance(charged, np.ndarray) and charged.shape == (8,), "fees has one value per hire"
assert charged.dtype == np.float64, "fees is a float array"
check_array(charged, [0.0, 1.5, 1.5, 4.0, 0.0, 4.0, 1.5, 4.0], "fees at the 2 and 30 minute boundaries and beyond", strict=True)
check_array(minutes, before, "fees does not change minutes")

check_array(fees(np.array([0.5, 1.0])), [0.0, 0.0], "hires that are all under 2 minutes cost nothing", strict=True)
check_array(fees(np.array([45.0, 181.0])), [4.0, 4.0], "every hire above 30 minutes costs 4.0, overdue or not", strict=True)
empty = fees(np.array([]))
assert np.shape(empty) == (0,), "no hires give no fees"
