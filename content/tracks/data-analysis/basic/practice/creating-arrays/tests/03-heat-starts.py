import numpy as np

# Sessions in which a fractional step makes np.arange give one value too many.
for minutes, heats in [(75, 7), (49, 11)]:
    starts = heat_starts(minutes, heats)
    assert isinstance(starts, np.ndarray) and starts.shape == (heats,), (
        "heat_starts gives exactly one start per heat, whatever the length of the session"
    )
    check_array(starts, np.arange(heats) * minutes / heats, "the starts are evenly spaced from 0, without the end of the session")

check_array(heat_starts(100, 6), [0.0, 100 / 6, 200 / 6, 50.0, 400 / 6, 500 / 6], "heat_starts with a gap that is not a whole number of minutes")
one = heat_starts(60, 1)
assert isinstance(one, np.ndarray) and one.dtype == np.float64, "heat_starts for one heat is a float64 array"
check_array(one, [0.0], "a session of one heat starts it at 0", strict=True)
check_array(heat_starts(30, 3), [0.0, 10.0, 20.0], "the end of the session is never a start", strict=True)
assert heat_starts(45, 5).dtype == np.float64, "heat_starts is float64 even when every start is a whole minute"
