import numpy as np

nan = np.nan
assert missing_temps(np.array([12.0, 12.5, 13.1])) == 0, "a full set of temperatures has nothing missing"
assert missing_temps(np.array([nan, nan, nan])) == 3, "every NaN counts as missing"
assert missing_temps(np.array([nan])) == 1, "a single missing temperature"
assert missing_temps(np.array([[14.0, nan], [nan, nan], [13.2, 12.8]])) == 3, "missing temperatures in a two-dimensional array"
assert missing_temps(np.array([0.0, -0.5, nan, 0.0])) == 1, "a temperature of 0.0 is a reading, not a missing one"
assert missing_temps(np.array([11.5, nan, 12.25], dtype=np.float32)) == 1, "missing temperatures in a float32 array"

temps = np.array([9.5, nan, 10.0])
missing_temps(temps)
assert np.isnan(temps[1]) and temps[0] == 9.5 and temps[2] == 10.0, "missing_temps does not change the temperatures"
