import numpy as np

miles = [[10, 25, 40], [5, 30, 18], [60, 12, 0], [7, 7, 7]]
km = ride_report(miles)["km"]
assert isinstance(km, np.ndarray), "km is a NumPy array"
assert km.shape == (4, 3), "km keeps one row per member and one column per Sunday"
check_array(km, [
    [16.09344, 40.2336, 64.37376],
    [8.04672, 48.28032, 28.968192],
    [96.56064, 19.312128, 0.0],
    [11.265408, 11.265408, 11.265408],
], "km converts every distance with MILES_TO_KM")

line = ride_report([14.0, 22.5, 9.0, 31.0])["km"]
assert isinstance(line, np.ndarray) and line.shape == (4,), "km of a log for one member is a one-dimensional array"
check_array(line, [22.530816, 36.21024, 14.484096, 49.889664], "km of a log for one member")

solo = ride_report([[26.2]])["km"]
assert isinstance(solo, np.ndarray) and solo.shape == (1, 1), "km of a log with one ride keeps its shape"
check_array(solo, [[42.1648128]], "km of a log with one ride")
