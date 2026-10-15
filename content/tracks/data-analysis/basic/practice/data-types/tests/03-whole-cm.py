import numpy as np

depths = np.array([0.4, 0.5, 1.5, 2.5, 3.5, 9.99, 41.0, 17.51])
before = depths.copy()
rounded = whole_cm(depths)
assert isinstance(rounded, np.ndarray) and rounded.dtype == np.int64, "whole_cm returns an int64 array"
check_array(rounded, np.array([0, 0, 2, 2, 4, 10, 41, 18]), "whole_cm rounds to the nearest whole centimetre, halves to the even neighbour", strict=True)
check_array(depths, before, "whole_cm does not change the depths it is given")

table = whole_cm(np.array([[22.7, 22.2], [5.9, 6.1]]))
check_array(table, np.array([[23, 22], [6, 6]]), "whole_cm keeps the shape of a two-dimensional array", strict=True)

none = whole_cm(np.array([]))
assert isinstance(none, np.ndarray) and none.shape == (0,) and none.dtype == np.int64, "no depths give an empty int64 array"
