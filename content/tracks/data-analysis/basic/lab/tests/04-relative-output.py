# Relative output against each day's median, and the strings that fall behind.
import numpy as np

nan = np.nan
june = clean(load_energy("data/june.csv"), 12.0)
relative = relative_output(june)
assert np.shape(relative) == (30, 6), "relative_output keeps June's shape"
check_array(relative[[0, 3, 7, 14]], [
    [0.961, 1.008, 1.023, 0.992, 0.682, 1.008],
    [1.055, nan, 1.036, 0.973, 0.673, 1.0],
    [nan, 0.988, 1.071, 1.012, 0.718, 1.0],
    [1.0, 1.036, nan, 1.0, 0.726, 1.012],
], "June's readings divided by each day's median")
assert np.isnan(relative[8]).all(), "a day with no readings is NaN throughout"
assert np.isnan(relative[16]).all(), "a day whose median is 0 is NaN throughout"

days = np.array([
    [4.0, 2.0, 6.0, nan],
    [0.0, 0.0, 0.0, 5.0],
    [3.0, 3.0, nan, 1.5],
])
before = days.copy()
check_array(relative_output(days), [
    [1.0, 0.5, 1.5, nan],
    [nan, nan, nan, nan],
    [1.0, 1.0, nan, 0.5],
], "each day uses its own median, and a median of 0 makes the day NaN even where readings are positive")
check_array(days, before, "relative_output does not change the array it is given")

weak = underperformers(june)
assert isinstance(weak, np.ndarray) and weak.dtype.kind in "iu", "underperformers returns an integer array"
check_array(weak, [4], "June's underperforming string")
check_array(underperformers(june, 1.0), [1, 4], "underperformers uses the threshold it is given, strictly below it, in ascending order")

july = clean(load_energy("data/july.csv"), 12.0)
none = underperformers(july)
assert isinstance(none, np.ndarray) and none.shape == (0,) and none.dtype.kind in "iu", (
    "underperformers returns an empty integer array when no string qualifies"
)

# Column 1's median is 0.75 although its mean is above 0.8; column 3 has no values at all.
mixed = np.array([
    [10.0, 7.5, 10.0, nan],
    [10.0, 7.5, 10.0, nan],
    [10.0, 30.0, 10.0, nan],
])
check_array(underperformers(mixed), [1], "underperformers compares the median relative output, and skips a string with none")
