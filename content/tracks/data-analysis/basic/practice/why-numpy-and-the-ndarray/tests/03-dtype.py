import numpy as np

assert ride_report([[10, 25, 40], [5, 30, 18]])["dtype"] == np.dtype("int64"), (
    "the dtype NumPy picks for whole numbers"
)
assert ride_report([10, 25.5, 40])["dtype"] == np.dtype("float64"), (
    "the dtype NumPy picks when one distance is a float"
)
assert ride_report([[0, 0], [0, 0]])["dtype"] == np.dtype("int64"), "the dtype of a log of whole zeros"
assert ride_report([3.0])["dtype"] == np.dtype("float64"), "the dtype of a single float distance"

whole = ride_report([10, 25, 40])["km"]
assert isinstance(whole, np.ndarray) and whole.dtype == np.dtype("float64"), (
    "km is a float array even when the miles are whole numbers"
)
check_array(whole, [16.09344, 40.2336, 64.37376], "km of a log of whole numbers")
