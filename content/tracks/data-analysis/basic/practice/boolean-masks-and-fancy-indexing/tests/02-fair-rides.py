import numpy as np

minutes = np.array([180.0, 1.99, 2.0, 180.01, 95.0, 0.0, 3.25, 400.0, 60.0])
before = minutes.copy()
kept = fair_rides(minutes)
check_array(kept, [180.0, 2.0, 95.0, 3.25, 60.0], "fair_rides keeps 2 and 180 themselves and everything between, in order", strict=True)
check_array(minutes, before, "fair_rides does not change minutes")

check_array(fair_rides(np.array([0.5, 1.0, 190.0])), np.array([]), "no fair hires give an empty array", strict=True)
check_array(fair_rides(np.array([7.0])), [7.0], "a single fair hire", strict=True)
check_array(fair_rides(np.array([])), np.array([]), "no hires at all give an empty array", strict=True)
