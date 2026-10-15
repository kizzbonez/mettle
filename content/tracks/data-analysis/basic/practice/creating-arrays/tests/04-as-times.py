import numpy as np

table = np.array([[30.5, 31.25], [29.9, 32.0]])
assert as_times(table) is table, "a two-dimensional float64 array is returned as it is"
check_array(table, [[30.5, 31.25], [29.9, 32.0]], "as_times does not change the array it is given")

whole = np.array([31, 30, 33])
converted = as_times(whole)
assert isinstance(converted, np.ndarray) and converted.dtype == np.float64, "an integer array becomes a float64 array"
assert converted is not whole and whole.dtype.kind == "i", "an integer array is converted into a new array, the original keeps its dtype"
check_array(converted, [31.0, 30.0, 33.0], "the values of a converted integer array")

nested = as_times([[28, 29.5], [30, 31]])
assert isinstance(nested, np.ndarray) and nested.dtype == np.float64 and nested.shape == (2, 2), (
    "a nested list becomes a two-dimensional float64 array"
)
check_array(nested, [[28.0, 29.5], [30.0, 31.0]], "the values of a converted nested list")

single = np.array([27.75])
assert as_times(single) is single, "a float64 array of one time is returned as it is"
